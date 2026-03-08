// DICOM tag to payload field mapping for manageUploads endpoint
export const dicomFieldMapping: Record<string, string> = {
  x0020000d: 'studyInstanceUID',
  x00100010: 'patientName',
  x00100020: 'patientId',
  x00100030: 'patientBirthDay',
  x00100040: 'patientSex',
  x00080020: 'studyDate',
  x00080030: 'studyTime',
  x00080060: 'modality',
  x00081030: 'studyDescription',
  x00080090: 'physician',
  hospitalId: 'hospitalId',
};

/**
 * Maps sanitized DICOM metadata to a clean payload with only required fields
 */
export const mapDicomToPayload = (metadata: any, hospitalId: string): Record<string, any> => {
  const payload: Record<string, any> = {};

  for (const [dicomKey, payloadKey] of Object.entries(dicomFieldMapping)) {
    // Get value from metadata using both standard and hex tag formats
    const value = metadata?.[dicomKey] ?? metadata?.[dicomKey.toUpperCase()] ?? '';
    payload[payloadKey] = value;
  }

  // Override hospitalId if provided
  if (hospitalId) {
    payload.hospitalId = hospitalId;
  }

  return payload;
};
