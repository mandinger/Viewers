import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

import { PubSubService } from '@ohif/core';
import { parseDicom, explicitDataSetToJS } from 'dicom-parser';
import { fetchTokenFromEndpoint } from '../../../../platform/app/src/utils/tokenUtils';
import { mapDicomToPayload } from './dicomFieldMapping';

export const EVENTS = {
  PROGRESS: 'event:DicomFileUploader:progress',
};

export interface DicomFileUploaderEvent {
  fileId: number;
}

export interface DicomFileUploaderProgressEvent extends DicomFileUploaderEvent {
  percentComplete: number;
}

type UploadCallbackMap = {
  progress: (evt: ProgressEvent<XMLHttpRequestEventTarget>) => void;
  timeout: () => void;
  abort: () => void;
  error: () => void;
};

export enum UploadStatus {
  NotStarted,
  InProgress,
  Success,
  Failed,
  Cancelled,
}

type CancelOrFailed = UploadStatus.Cancelled | UploadStatus.Failed;

export class UploadRejection {
  message: string;
  status: CancelOrFailed;

  constructor(status: CancelOrFailed, message: string) {
    this.message = message;
    this.status = status;
  }
}

const isAnonymizedDicom = (data: any): boolean => {
  if (data?.string && typeof data.string === 'function') {
    const patientNameValue = data.string('x00100010');
    return !patientNameValue || patientNameValue.trim().length === 0 || patientNameValue === 'Anonymized^^';
  }

  const patientName = data?.PatientName ?? data?.x00100010;

  if (!patientName) {
    return true;
  }

  if (typeof patientName === 'string') {
    return patientName.trim().length === 0;
  }
};

// Clean DICOM metadata by replacing raw parser elements ({dataOffset, length}) with empty strings
const sanitizeDicomMetadata = (value: any): any => {
  if (value == null) return '';
  
  // Check if this is a raw DICOM element object
  if (typeof value === 'object' && 'dataOffset' in value && 'length' in value) {
    return '';
  }
  
  // Recursively clean arrays
  if (Array.isArray(value)) {
    return value.map(sanitizeDicomMetadata);
  }
  
  // Recursively clean objects
  if (typeof value === 'object') {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(value)) {
      cleaned[key] = sanitizeDicomMetadata(val);
    }
    return cleaned;
  }
  
  return value;
};

export default class DicomFileUploader extends PubSubService {
  private _file;
  private _fileId;
  private _dataSource;
  private _loadPromise;
  private _abortController = new AbortController();
  private _status: UploadStatus = UploadStatus.NotStarted;
  private _percentComplete = 0;
  private _userAuthenticationService; // Add this

  constructor(file, dataSource, userAuthenticationService) { // Add parameter
    super(EVENTS);
    this._file = file;
    this._fileId = dicomImageLoader.wadouri.fileManager.add(file);
    this._dataSource = dataSource;
    this._userAuthenticationService = userAuthenticationService; // Store it
  }

  getFileId(): string {
    return this._fileId;
  }

  getFileName(): string {
    return this._file?.name || `upload-${this._fileId}.dcm`;
  }

  getFileSize(): number {
    return this._file.size;
  }

  cancel(): void {
    this._abortController.abort();
  }

  getStatus(): UploadStatus {
    return this._status;
  }

  getPercentComplete(): number {
    return this._percentComplete;
  }

  async load(): Promise<void> {
    if (this._loadPromise) {
      // Already started loading, return the load promise.
      return this._loadPromise;
    }

    this._loadPromise = new Promise<void>((resolve, reject) => {
      // The upload listeners: fire progress events and/or settle the promise.
      const uploadCallbacks: UploadCallbackMap = {
        progress: evt => {
          if (!evt.lengthComputable) {
            // Progress computation is not possible.
            return;
          }

          this._status = UploadStatus.InProgress;

          this._percentComplete = Math.round((100 * evt.loaded) / evt.total);
          this._broadcastEvent(EVENTS.PROGRESS, {
            fileId: this._fileId,
            percentComplete: this._percentComplete,
          });
        },
        timeout: () => {
          this._reject(reject, new UploadRejection(UploadStatus.Failed, 'The request timed out.'));
        },
        abort: () => {
          this._reject(reject, new UploadRejection(UploadStatus.Cancelled, 'Cancelled'));
        },
        error: () => {
          this._reject(reject, new UploadRejection(UploadStatus.Failed, 'The request failed.'));
        },
      };

      // First try to load the file.
      dicomImageLoader.wadouri
        .loadFileRequest(this._fileId)
        .then(async dicomFile => {
          if (this._abortController.signal.aborted) {
            this._reject(reject, new UploadRejection(UploadStatus.Cancelled, 'Cancelled'));
            return;
          }

          const dicomData = parseDicom(new Uint8Array(dicomFile));
          
          // Handle both explicit and implicit VR DICOM files
          let data;
          try {
            data = explicitDataSetToJS(dicomData);
          } catch (error) {
            console.warn('[DicomFileUploader] Explicit VR parsing failed, trying implicit VR:', error.message);
            // For implicit VR files, parse more carefully
            data = dicomData;
          }
          
          // Clean metadata to remove raw parser elements
          const sanitizedMetadata = sanitizeDicomMetadata(data);
          
          // Extract UIDs as strings from sanitized data
          const parsedStudyUID = String(sanitizedMetadata?.StudyInstanceUID || sanitizedMetadata?.x0020000d || '');
          const parsedSeriesUID = String(sanitizedMetadata?.SeriesInstanceUID || sanitizedMetadata?.x0020000e || '');
          const parsedSopUID = String(sanitizedMetadata?.SOPInstanceUID || sanitizedMetadata?.x00080018 || '');

          if (isAnonymizedDicom(sanitizedMetadata)) {
            console.log('[DicomFileUploader] Anonymized DICOM detected. Upload rejected.');
            this._reject(
              reject,
              new UploadRejection(
                UploadStatus.Failed,
                'Anonymized DICOM files are not supported.'
              )
            );
            return;
          }

          console.log('[DicomFileUploader] Starting upload process...');
          console.log('[DicomFileUploader] Parsed UIDs:', {
            StudyInstanceUID: parsedStudyUID,
            SeriesInstanceUID: parsedSeriesUID,
            SOPInstanceUID: parsedSopUID,
          });
          console.log('📄 [DicomFileUploader] DICOM metadata (sanitized):', sanitizedMetadata);
          
          const _apiUrl = 'https://kumo-api.ashycliff-3915e68d.eastus.azurecontainerapps.io/';
          // const _apiUrl = 'http://localhost:5500/';
          const _uploadEndpoint = 'dataVerseService/manageUploads';
          const _tokenEndpoint = 'microsoftservice/appLoginReadWrite';
          const _urlUpload = _apiUrl + _uploadEndpoint;

          const urlParams = new URLSearchParams(window.location.search);
          const accountid = urlParams.get('accountId');
          
          // Fetch bearer token from appLoginReadWrite endpoint
          const tokenPayload = await fetchTokenFromEndpoint(_apiUrl, _tokenEndpoint);
          const bearerToken = tokenPayload?.access_token || null;
          
          if (!bearerToken) {
            console.warn('[DicomFileUploader] Failed to obtain bearer token from appLoginReadWrite endpoint');
          } else {
            console.log('[DicomFileUploader] Bearer token obtained successfully');
          }

          // Create and setup XMLHttpRequest first, before any async operations
          let request;
          try {
            request = new XMLHttpRequest();
            console.log('[DicomFileUploader] XMLHttpRequest created successfully');
            
            this._addRequestCallbacks(request, uploadCallbacks);
            console.log('[DicomFileUploader] Request callbacks added successfully');

            // Override userAuthenticationService to return our bearer token
            if (bearerToken && this._userAuthenticationService) {
              console.log('[DicomFileUploader] userAuthenticationService exists, overriding getAuthorizationHeader');
              const originalGetAuthorizationHeader = this._userAuthenticationService.getAuthorizationHeader.bind(this._userAuthenticationService);
              this._userAuthenticationService.getAuthorizationHeader = () => {
                console.log('[DicomFileUploader] getAuthorizationHeader called, returning bearer token');
                const header = { Authorization: `Bearer ${bearerToken}` };
                console.log('[DicomFileUploader] Returning header:', header);
                return header;
              };
              console.log('[DicomFileUploader] userAuthenticationService.getAuthorizationHeader overridden successfully');
            } else {
              console.error('[DicomFileUploader] Cannot override - bearerToken:', !!bearerToken, 'userAuthenticationService:', !!this._userAuthenticationService);
            }
          } catch (error) {
            console.error('[DicomFileUploader] Error setting up XMLHttpRequest:', error);
            this._reject(reject, new UploadRejection(UploadStatus.Failed, `Failed to setup request: ${error.message}`));
            return;
          }

          // Send metadata to manageUploads endpoint before DICOM upload
          console.log('[DicomFileUploader] Initiating manageUploads fetch...');
          if (accountid) {
            try {
              // Map sanitized metadata to clean payload with only required fields
              const mappedPayload = mapDicomToPayload(sanitizedMetadata, accountid);
              console.log('[DicomFileUploader] Mapped payload:', mappedPayload);
              
              const response = await fetch(_urlUpload, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(bearerToken && { Authorization: `Bearer ${bearerToken}` }),
                },
                body: JSON.stringify({
                  metadataImg: mappedPayload,
                  kmo_UUID: parsedSeriesUID
                }),
              });

              console.log(
                '[DicomFileUploader] manageUploads response:',
                response.status,
                response.statusText
              );

              if (!response.ok) {
                this._reject(
                  reject,
                  new UploadRejection(
                    UploadStatus.Failed,
                    `manageUploads failed: ${response.status} ${response.statusText}`
                  )
                );
                return;
              }

              const result = await response.json();
              console.log('[DicomFileUploader] manageUploads result:', result);
            } catch (error) {
              console.error('[DicomFileUploader] manageUploads fetch error:', error);
              this._reject(
                reject,
                new UploadRejection(UploadStatus.Failed, 'manageUploads failed')
              );
              return;
            }
          } else {
            console.warn('[DicomFileUploader] Missing accountId. Upload rejected.');
            this._reject(
              reject,
              new UploadRejection(UploadStatus.Failed, 'Missing accountId')
            );
            return;
          }
          console.log('[DicomFileUploader] manageUploads succeeded, proceeding to store.dicom()');

          if (!this._checkDicomFile(dicomFile)) {
            // The file is not DICOM
            this._reject(
              reject,
              new UploadRejection(UploadStatus.Failed, 'Not a valid DICOM file.')
            );
            return;
          }

          // Do the actual upload by supplying the DICOM file and upload callbacks/listeners.
          return this._dataSource.store
            .dicom(dicomFile, request)
            .then(() => {
              this._status = UploadStatus.Success;
              resolve();
            })
            .catch(reason => {
              this._reject(reject, reason);
            });
        })
        .catch(reason => {
          this._reject(reject, reason);
        });
    });

    return this._loadPromise;
  }

  private _isRejected(): boolean {
    return this._status === UploadStatus.Failed || this._status === UploadStatus.Cancelled;
  }

  private _reject(reject: (reason?: any) => void, reason: any) {
    if (this._isRejected()) {
      return;
    }

    if (reason instanceof UploadRejection) {
      this._status = reason.status;
      reject(reason);
      return;
    }

    this._status = UploadStatus.Failed;

    if (reason.message) {
      reject(new UploadRejection(UploadStatus.Failed, reason.message));
      return;
    }

    reject(new UploadRejection(UploadStatus.Failed, reason));
  }

  private _addRequestCallbacks(request: XMLHttpRequest, uploadCallbacks: UploadCallbackMap) {
    const abortCallback = () => request.abort();
    this._abortController.signal.addEventListener('abort', abortCallback);

    for (const [eventName, callback] of Object.entries(uploadCallbacks) as [
      keyof UploadCallbackMap,
      UploadCallbackMap[keyof UploadCallbackMap]
    ][]) {
      request.upload.addEventListener(eventName, callback as EventListener);
    }

    const cleanUpCallback = () => {
      this._abortController.signal.removeEventListener('abort', abortCallback);

      for (const [eventName, callback] of Object.entries(uploadCallbacks) as [
        keyof UploadCallbackMap,
        UploadCallbackMap[keyof UploadCallbackMap]
      ][]) {
        request.upload.removeEventListener(eventName, callback as EventListener);
      }

      request.removeEventListener('loadend', cleanUpCallback);
    };
    request.addEventListener('loadend', cleanUpCallback);
  }

  private _checkDicomFile(arrayBuffer: ArrayBuffer) {
    if (arrayBuffer.byteLength <= 132) {
      return false;
    }
    const arr = new Uint8Array(arrayBuffer.slice(128, 132));
    // bytes from 128 to 132 must be "DICM"
    return Array.from('DICM').every((char, i) => char.charCodeAt(0) === arr[i]);
  }
}
