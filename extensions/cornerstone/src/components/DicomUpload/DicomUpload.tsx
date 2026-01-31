import React, { useCallback, useState } from 'react';
import { ReactElement } from 'react';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DicomFileUploader from '../../utils/DicomFileUploader';
import DicomUploadProgress from './DicomUploadProgress';
import { Button, ButtonEnums } from '@ohif/ui';
import dcmjs from 'dcmjs';
import StudyInfoForm, { StudyFormData } from './StudyInfoForm';
import {
  generateDicomUID,
  getSopClassUID,
  createDicomMetaInfo,
  DICOM_SOP_CLASS_UIDS,
} from '../../utils/dicomMetadata';
import './DicomUpload.css';

type DicomUploadProps = {
  dataSource;
  onComplete: () => void;
  onStarted: () => void;
  servicesManager?: any;
};

function DicomUpload({ dataSource, onComplete, onStarted, servicesManager }: DicomUploadProps): ReactElement {
  const baseClassNames = 'h-full w-full flex flex-col bg-black select-none';
  const [dicomFileUploaderArr, setDicomFileUploaderArr] = useState([]);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);

  const isImageFile = (file: File): boolean => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    return imageTypes.includes(file.type);
  };

  const onDrop = useCallback(async acceptedFiles => {
    onStarted();
    const userAuthenticationService = servicesManager?.services?.userAuthenticationService;
    
    // Separate DICOM and image files
    const dicomFiles = acceptedFiles.filter(file => !isImageFile(file));
    const imageFiles = acceptedFiles.filter(file => isImageFile(file));

    // Process DICOM files immediately
    const uploaders = dicomFiles.map(file => 
      new DicomFileUploader(file, dataSource, userAuthenticationService)
    );
    
    // If there are image files, show form and store them
    if (imageFiles.length > 0) {
      setSelectedImageFiles(imageFiles);
      setShowStudyForm(true);
    } else if (uploaders.length > 0) {
      // Only DICOM files, start upload immediately
      setDicomFileUploaderArr(uploaders);
    }
  }, [dataSource, servicesManager]);

  // Convert image files to DICOM and combine with any existing DICOM files
  const convertImagesToDicom = useCallback(async (imageFiles: File[], studyData: StudyFormData) => {
    try {
      const userAuthenticationService = servicesManager?.services?.userAuthenticationService;
      const uploadersFromDicom: any[] = [];

      // Process each image file
      for (const imageFile of imageFiles) {
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
        
        // Extract RGB data from RGBA (remove alpha channel)
        const rgbaData = imageData.data;
        const rgbData = new Uint8Array(img.width * img.height * 3);
        let rgbIndex = 0;
        for (let i = 0; i < rgbaData.length; i += 4) {
          rgbData[rgbIndex++] = rgbaData[i];     // R
          rgbData[rgbIndex++] = rgbaData[i + 1]; // G
          rgbData[rgbIndex++] = rgbaData[i + 2]; // B
          // Skip alpha channel (rgbaData[i + 3])
        }

        URL.revokeObjectURL(imageUrl);

        // Generate UIDs using production-ready utility
        const studyInstanceUID = generateDicomUID();
        const seriesInstanceUID = generateDicomUID();
        const sopInstanceUID = generateDicomUID();

        // Convert study date and time to DICOM format (YYYYMMDD and HHMMSS)
        const studyDate = studyData.studyDate.replace(/-/g, '');
        const studyTime = studyData.studyTime;
        
        console.log('Creating DICOM with modality:', studyData.modality);

        // Create DICOM dataset using dcmjs
        const dataset = {
          // Patient Module
          PatientName: studyData.patientName,
          PatientID: studyData.patientID,
          PatientBirthDate: studyData.birthDate.replace(/-/g, ''),
          PatientSex: studyData.gender,

          // General Study Module
          StudyInstanceUID: studyInstanceUID,
          StudyDate: studyDate,
          StudyTime: studyTime,
          ReferringPhysicianName: studyData.referringPhysician,
          StudyID: '1',
          AccessionNumber: '',
          StudyDescription: studyData.description,

          // General Series Module
          SeriesInstanceUID: seriesInstanceUID,
          SeriesNumber: '1',
          Modality: studyData.modality,

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
          SOPClassUID: getSopClassUID('secondary_capture'),
          SOPInstanceUID: sopInstanceUID,

          _meta: createDicomMetaInfo(DICOM_SOP_CLASS_UIDS.SECONDARY_CAPTURE_IMAGE, sopInstanceUID),
        };

        // Denaturalize and add PixelData properly as OB (Other Byte) VR
        const denaturalized = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);
        denaturalized['7FE00010'] = {
          vr: 'OB',
          Value: [rgbData],
        };

        const dicomDict = new dcmjs.data.DicomDict(denaturalized);
        const part10Buffer = dicomDict.write();
        
        console.log('✅ DICOM dataset created with Modality:', dataset.Modality, 'Dimensions:', img.width, 'x', img.height);

        // Create a DicomFileUploader with the converted DICOM blob
        const downloadBlob = new Blob([part10Buffer], { type: 'application/dicom' });
        uploadersFromDicom.push(
          new DicomFileUploader(downloadBlob, dataSource, userAuthenticationService)
        );
      }

      // Update state with all uploaders (existing DICOM + converted images)
      setDicomFileUploaderArr(prevUploadersArr => [...prevUploadersArr, ...uploadersFromDicom]);
      
      console.log('Successfully converted all images to DICOM');
    } catch (error) {
      console.error('Error converting images to DICOM:', error);
      alert(`Error converting images: ${error.message}`);
    }
  }, [dataSource, servicesManager]);

  const handleStudyFormSubmit = useCallback(
    (studyData: StudyFormData) => {
      console.log('🔄 Converting images with study data:', studyData);
      if (selectedImageFiles.length > 0) {
        convertImagesToDicom(selectedImageFiles, studyData);
        setShowStudyForm(false);
        setSelectedImageFiles([]);
      }
    },
    [selectedImageFiles, convertImagesToDicom]
  );

  const handleStudyFormCancel = useCallback(() => {
    setShowStudyForm(false);
    setSelectedImageFiles([]);
  }, []);

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
            <div className="text-aqua-pale pt-3 text-lg">(DICOM files and images supported)</div>
          </div>
        )}
      </Dropzone>
    );
  };

  return (
    <>
      {showStudyForm && (
        <StudyInfoForm 
          onSubmit={handleStudyFormSubmit} 
          onCancel={handleStudyFormCancel}
          fileCount={selectedImageFiles.length}
        />
      )}
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
