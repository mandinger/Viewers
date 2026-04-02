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

const convertDicomTimeToUtcTime = (date: string, time: string): string => {
  if (!date || !time) return time;

  // Parse DICOM date YYYYMMDD
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);

  // Parse DICOM time HHMMSS(.ffffff)
  const cleanTime = time.split('.')[0];
  const hour = cleanTime.slice(0, 2) || "00";
  const minute = cleanTime.slice(2, 4) || "00";
  const second = cleanTime.slice(4, 6) || "00";

  const localDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);

  const utcHours = String(localDate.getUTCHours()).padStart(2, "0");
  const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, "0");
  const utcSeconds = String(localDate.getUTCSeconds()).padStart(2, "0");

  return `${utcHours}${utcMinutes}${utcSeconds}`;
};

/**
 * Maps sanitized DICOM metadata to a clean payload with only required fields
 */
export const mapDicomToPayload = (metadata: any, hospitalId: string): Record<string, any> => {
  const payload: Record<string, any> = {};

  for (const [dicomKey, payloadKey] of Object.entries(dicomFieldMapping)) {
    const value = metadata?.[dicomKey] ?? metadata?.[dicomKey.toUpperCase()] ?? '';
    payload[payloadKey] = value;
  }

  // Convert studyTime to UTC time only
  if (payload.studyDate && payload.studyTime) {
    payload.studyTime = convertDicomTimeToUtcTime(payload.studyDate, payload.studyTime);
  }

  if (hospitalId) {
    payload.hospitalId = hospitalId;
  }

  return payload;
};
