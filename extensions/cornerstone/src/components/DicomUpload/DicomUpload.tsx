import React, { useCallback, useState, useRef } from 'react';
import { ReactElement } from 'react';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DicomFileUploader from '../../utils/DicomFileUploader';
import DicomUploadProgress from './DicomUploadProgress';
import { Button, ButtonEnums } from '@ohif/ui';
import dcmjs from 'dcmjs';
import './DicomUpload.css';

type DicomUploadProps = {
  dataSource;
  onComplete: () => void;
  onStarted: () => void;
  servicesManager?: any; // Add this
};

function DicomUpload({ dataSource, onComplete, onStarted, servicesManager }: DicomUploadProps): ReactElement {
  const baseClassNames = 'h-full w-full flex flex-col bg-black select-none';
  const [dicomFileUploaderArr, setDicomFileUploaderArr] = useState([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async acceptedFiles => {
    onStarted();
    const userAuthenticationService = servicesManager?.services?.userAuthenticationService;
    setDicomFileUploaderArr(
      acceptedFiles.map(file => new DicomFileUploader(file, dataSource, userAuthenticationService))
    );
  }, [dataSource, servicesManager]);

  // SPIKE: Convert PNG/JPG to DICOM and download
  const convertImageToDicom = useCallback(async (imageFile: File) => {
    try {
      // Read image file
      const arrayBuffer = await imageFile.arrayBuffer();
      const blob = new Blob([arrayBuffer]);
      const imageUrl = URL.createObjectURL(blob);

      // Load image to get dimensions and pixel data
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Draw image to canvas to extract pixel data
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixelData = new Uint8Array(imageData.data.buffer);

      URL.revokeObjectURL(imageUrl);

      // Generate UIDs
      const generateUID = () => {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000000).toString();
        return `1.2.840.113619.2.408.${timestamp}.${random}`;
      };

      const studyInstanceUID = generateUID();
      const seriesInstanceUID = generateUID();
      const sopInstanceUID = generateUID();

      // Get today's date in DICOM format (YYYYMMDD)
      const today = new Date();
      const studyDate = today.toISOString().slice(0, 10).replace(/-/g, '');
      const studyTime = today.toTimeString().slice(0, 8).replace(/:/g, '');

      // Create DICOM dataset using dcmjs
      const dataset = {
        // Patient Module
        PatientName: 'TEST^PATIENT',
        PatientID: 'TEST123',
        PatientBirthDate: '',
        PatientSex: '',

        // General Study Module
        StudyInstanceUID: studyInstanceUID,
        StudyDate: studyDate,
        StudyTime: studyTime,
        ReferringPhysicianName: '',
        StudyID: '1',
        AccessionNumber: '',
        StudyDescription: 'Test Study from Image Conversion',

        // General Series Module
        SeriesInstanceUID: seriesInstanceUID,
        SeriesNumber: '1',
        Modality: 'OT', // Other

        // General Equipment Module
        Manufacturer: 'OHIF',
        ManufacturerModelName: 'Image Converter',

        // SC Equipment Module (Secondary Capture)
        ConversionType: 'WSD', // Workstation

        // General Image Module
        InstanceNumber: '1',
        PatientOrientation: '',

        // Image Pixel Module
        SamplesPerPixel: 3,
        PhotometricInterpretation: 'RGB',
        Rows: img.height,
        Columns: img.width,
        BitsAllocated: 8,
        BitsStored: 8,
        HighBit: 7,
        PixelRepresentation: 0,
        PlanarConfiguration: 0,

        // SOP Common Module
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.7', // Secondary Capture Image Storage
        SOPInstanceUID: sopInstanceUID,

        // Pixel Data
        PixelData: [pixelData.buffer],

        _meta: {
          FileMetaInformationVersion: new Uint8Array([0, 1]).buffer,
          TransferSyntaxUID: { Value: ['1.2.840.10008.1.2.1'] }, // Explicit VR Little Endian
          ImplementationClassUID: { Value: ['1.2.840.113619.6.408'] },
          ImplementationVersionName: { Value: ['OHIF-IMG-CONVERT'] },
          MediaStorageSOPClassUID: { Value: ['1.2.840.10008.5.1.4.1.1.7'] },
          MediaStorageSOPInstanceUID: { Value: [sopInstanceUID] },
        },
      };

      // Convert to DICOM P10 format using dcmjs
      const denaturalized = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);
      const dicomDict = new dcmjs.data.DicomDict(denaturalized);
      dicomDict.dict = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);
      const part10Buffer = dicomDict.write();

      // Trigger download
      const downloadBlob = new Blob([part10Buffer], { type: 'application/dicom' });
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_${imageFile.name.replace(/\.(png|jpg|jpeg)$/i, '')}.dcm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Successfully converted image to DICOM and triggered download');
    } catch (error) {
      console.error('❌ Error converting image to DICOM:', error);
      alert(`Error converting image: ${error.message}`);
    }
  }, []);

  const handleImageConversion = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);

  const handleImageFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        convertImageToDicom(file);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    },
    [convertImageToDicom]
  );

  const getDropZoneComponent = (): ReactElement => {
    return (
      <Dropzone
        onDrop={acceptedFiles => {
          onDrop(acceptedFiles);
        }}
        noClick
      >
        {({ getRootProps }) => (
          <div
            {...getRootProps()}
            className="dicom-upload-drop-area-border-dash m-5 flex h-full flex-col items-center justify-center"
          >
            <div className="flex gap-3">
              <Dropzone
                onDrop={onDrop}
                noDrag
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <Button
                      disabled={false}
                      onClick={() => { }}
                    >
                      {'Add files'}
                      <input {...getInputProps()} />
                    </Button>
                  </div>
                )}
              </Dropzone>
              <Dropzone
                onDrop={onDrop}
                noDrag
              >
                {({ getRootProps, getInputProps }) => (
                  <div {...getRootProps()}>
                    <Button
                      type={ButtonEnums.type.secondary}
                      disabled={false}
                      onClick={() => { }}
                    >
                      {'Add folder'}
                      <input
                        {...getInputProps()}
                        webkitdirectory="true"
                        mozdirectory="true"
                      />
                    </Button>
                  </div>
                )}
              </Dropzone>
            </div>
            <div className="pt-5">or drag images or folders here</div>
            <div className="text-aqua-pale pt-3 text-lg">(DICOM files supported)</div>
            
            {/* SPIKE: Image to DICOM Converter */}
            <div className="mt-8 border-t border-gray-700 pt-6">
              <div className="text-yellow-400 mb-3 text-sm font-bold">🔬 DEV SPIKE: Image Converter</div>
              <Button
                type={ButtonEnums.type.primary}
                disabled={false}
                onClick={handleImageConversion}
              >
                {'Convert PNG/JPG to DICOM'}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageFileSelect}
                style={{ display: 'none' }}
              />
              <div className="text-gray-400 mt-2 text-xs">
                Select PNG/JPG → Converts to DICOM SC → Downloads .dcm file
              </div>
            </div>
          </div>
        )}
      </Dropzone>
    );
  };

  return (
    <>
      {dicomFileUploaderArr.length ? (
        <div className={classNames('h-[calc(100vh-300px)]', baseClassNames)}>
          <DicomUploadProgress
            dicomFileUploaderArr={Array.from(dicomFileUploaderArr)}
            onComplete={onComplete}
          />
        </div>
      ) : (
        <div className={classNames(baseClassNames)}>{getDropZoneComponent()}</div>
      )}
    </>
  );
}

DicomUpload.propTypes = {
  dataSource: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onStarted: PropTypes.func.isRequired,
};

export default DicomUpload;
