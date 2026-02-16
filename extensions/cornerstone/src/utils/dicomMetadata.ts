/**
 * DICOM Metadata Constants and Utilities
 * References DICOM Standard Part 4 and Part 5 for UIDs and values
 */

/**
 * Custom UID Root for generated image-to-DICOM studies
 * Format requested by user: 1.2.276.0.2783747.3.1.2.<YYYYMMDD>.<HHMMSSmmmm>.<rand>
 */
export const CUSTOM_UID_ROOT = '1.2.276.0.2783747.3.1.2';

/**
 * Implementation Class UID - Identifies the implementation of the DICOM standard
 * Should be unique to organization/application
 * Format: UID_ROOT.application_id
 */
export const IMPLEMENTATION_CLASS_UID = `${CUSTOM_UID_ROOT}.2`;

/**
 * Implementation Version Name - Identifies the version of the DICOM implementation
 * Update this value when deploying new versions
 */
export const IMPLEMENTATION_VERSION_NAME = 'OHIF-3.9.0';

/**
 * DICOM SOP Class UIDs - Identifies the type of DICOM object
 * Reference: DICOM Standard Part 4, Annex B
 */
export const DICOM_SOP_CLASS_UIDS = {
  SECONDARY_CAPTURE_IMAGE: '1.2.840.10008.5.1.4.1.1.7',
  MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE: '1.2.840.10008.5.1.4.1.1.7.4',
  CT_IMAGE: '1.2.840.10008.5.1.4.1.1.2',
  MR_IMAGE: '1.2.840.10008.5.1.4.1.1.4',
  ULTRASOUND_IMAGE: '1.2.840.10008.5.1.4.1.1.6.4',
  JPEG_BASELINE: '1.2.840.10008.5.1.4.1.1.7.2',
  JPEG_LOSSLESS: '1.2.840.10008.5.1.4.1.1.7.3',
  PNG: '1.2.840.10008.5.1.4.1.1.66.4', // Segmentation Storage, but used for PNG
} as const;

/**
 * DICOM Transfer Syntax UIDs - Defines encoding method
 * Reference: DICOM Standard Part 5, Annex A
 */
export const DICOM_TRANSFER_SYNTAX_UIDS = {
  EXPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2.1',
  EXPLICIT_VR_BIG_ENDIAN: '1.2.840.10008.1.2.2',
  IMPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2',
  JPEG_BASELINE: '1.2.840.10008.1.2.5',
  JPEG_LOSSLESS: '1.2.840.10008.1.2.4.70',
} as const;

/**
 * Generate a unique Study Instance UID based on current date/time and random component
 * Example:
 *  StudyInstanceUID: 1.2.276.0.2783747.3.1.2.20260204.2121533110.8046
 *  SeriesInstanceUID: {StudyInstanceUID}.4.0
 *  SOPInstanceUID: {StudyInstanceUID}.4
 */
export const generateStudyInstanceUID = (studyDate?: string, studyTime?: string): string => {
  const now = new Date();
  const datePart = studyDate && studyDate.length === 8
    ? studyDate
    : `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const timeSource = studyTime && studyTime.length >= 4 ? studyTime : '';
  const cleanTime = timeSource.replace(/:/g, '');
  const hh = cleanTime.slice(0, 2) || String(now.getHours()).padStart(2, '0');
  const mm = cleanTime.slice(2, 4) || String(now.getMinutes()).padStart(2, '0');
  const ss = cleanTime.slice(4, 6) || String(now.getSeconds()).padStart(2, '0');
  const mmm = String(now.getMilliseconds()).padStart(3, '0');

  // Keep component under 2^31 by limiting random digits
  const random = Math.floor(Math.random() * 10000);
  return `${CUSTOM_UID_ROOT}.${datePart}.${hh}${mm}${ss}${mmm}.${random}`;
};

export const generateSeriesInstanceUID = (studyInstanceUID: string, seriesNumber: string | number = 4): string => {
  return `${studyInstanceUID}.${seriesNumber}.0`;
};

export const generateSopInstanceUID = (
  studyInstanceUID: string,
  sopNumber: string | number = 4,
  instanceIndex?: number
): string => {
  if (instanceIndex !== undefined && instanceIndex > 0) {
    return `${studyInstanceUID}.${sopNumber}.${instanceIndex + 1}`;
  }
  return `${studyInstanceUID}.${sopNumber}`;
};

/**
 * Get SOP Class UID based on image type
 */
export const getSopClassUID = (
  imageFormat: 'secondary_capture' | 'secondary_capture_multiframe' | 'jpeg' | 'png' = 'secondary_capture'
): string => {
  switch (imageFormat) {
    case 'jpeg':
      return DICOM_SOP_CLASS_UIDS.JPEG_BASELINE;
    case 'png':
      return DICOM_SOP_CLASS_UIDS.PNG;
    case 'secondary_capture_multiframe':
      return DICOM_SOP_CLASS_UIDS.MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE;
    case 'secondary_capture':
    default:
      return DICOM_SOP_CLASS_UIDS.SECONDARY_CAPTURE_IMAGE;
  }
};

/**
 * DICOM Meta Information structure for file creation
 * Per DICOM Standard Part 10, File Meta Information
 */
export const createDicomMetaInfo = (
  sopClassUID: string,
  sopInstanceUID: string,
  transferSyntaxUID: string = DICOM_TRANSFER_SYNTAX_UIDS.EXPLICIT_VR_LITTLE_ENDIAN
) => {
  return {
    FileMetaInformationVersion: new Uint8Array([0, 1]).buffer,
    TransferSyntaxUID: { Value: [transferSyntaxUID] },
    ImplementationClassUID: { Value: [IMPLEMENTATION_CLASS_UID] },
    ImplementationVersionName: { Value: [IMPLEMENTATION_VERSION_NAME] },
    MediaStorageSOPClassUID: { Value: [sopClassUID] },
    MediaStorageSOPInstanceUID: { Value: [sopInstanceUID] },
  };
};

/**
 * Validate DICOM UID format
 * Per DICOM Standard: UID components separated by '.', each component < 2^31
 */
export const isValidDicomUID = (uid: string): boolean => {
  if (!uid || typeof uid !== 'string') return false;
  
  const components = uid.split('.');
  
  // UID must have at least 2 components
  if (components.length < 2) return false;
  
  // Each component must be numeric and < 2^31
  for (const component of components) {
    if (!/^\d+$/.test(component)) return false;
    if (parseInt(component) >= Math.pow(2, 31)) return false;
  }
  
  return true;
};
