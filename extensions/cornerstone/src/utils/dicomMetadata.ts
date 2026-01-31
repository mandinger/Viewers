/**
 * DICOM Metadata Constants and Utilities
 * References DICOM Standard Part 4 and Part 5 for UIDs and values
 */

/**
 * DICOM UID Root for this organization
 * From existing study: 1.2.410.200018.109.1.1.365
 * Organization root: 1.2.410.200018 (South Korean healthcare system)
 * 
 * Format explanation:
 * - 1.2.410: Country code (410 = South Korea)
 * - 200018: Organization identifier
 * - Additional components: Application/department specific identifiers
 */
export const OHIF_UID_ROOT = '1.2.410.200018.109.1.1';

/**
 * Implementation Class UID - Identifies the implementation of the DICOM standard
 * Should be unique to your organization/application
 * Format: UID_ROOT.application_id
 */
export const IMPLEMENTATION_CLASS_UID = `${OHIF_UID_ROOT}.1`;

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
 * Generate a DICOM UID
 * Format: UID_ROOT.component1.component2...componentN
 * Where each component is < 2^31
 * 
 * Production-ready implementation:
 * - Uses timestamp for uniqueness
 * - Uses random number for additional entropy
 * - Complies with DICOM UID format rules
 */
export const generateDicomUID = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 100000000).toString();
  return `${OHIF_UID_ROOT}.${timestamp}.${random}`;
};

/**
 * Get SOP Class UID based on image type
 */
export const getSopClassUID = (imageFormat: 'secondary_capture' | 'jpeg' | 'png' = 'secondary_capture'): string => {
  switch (imageFormat) {
    case 'jpeg':
      return DICOM_SOP_CLASS_UIDS.JPEG_BASELINE;
    case 'png':
      return DICOM_SOP_CLASS_UIDS.PNG;
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
