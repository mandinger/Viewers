const tokenService = require('../services/tokenService');
const keyValueDictionary = require('../utils/keyValueDictionary');
const axios = require('axios');

require('dotenv').config();

const manageScreenShot = async (req, res) => {
  const { base64Image, teleconsultationID } = req.body;

  //todo: Mover validaciones a un negocio
  if (!base64Image || !teleconsultationID) {
    return res.status(400).json({ message: 'Both base64Image and identifier are required.' });
  }

  try {
    //todoNich: mover validaciones
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid base64 format.' });
    }

    const extension = matches[1];
    const fileName = `${teleconsultationID}.${extension}`;
    const token = await tokenService.getToken();
    console.log(token);
    /**
     * Hacer algo con la imge
     */

    res.status(201).json({ message: 'Image uploaded successfully!', fileName });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ message: 'Failed to save image.', error: error.message });
  }
};

const manageUploads = async (req, res) => {
  const { metadataImg, accountid, kmo_UUID } = req.body;
  const dataverseApiUrl = process.env.RESOURCE_DATAVERSE + "/api/data/v9.2";

  if (!dataverseApiUrl) {
    return res.status(500).json({ message: 'Missing RESOURCE_DATAVERSE configuration.' });
  }

  if (!kmo_UUID) {
    return res.status(400).json({ message: 'kmo_UUID is required.' });
  }

  const mapMetadataToDictionary = metadata =>
    Object.entries(metadata || {}).reduce((acc, [key, value]) => {
      const mappedKey = keyValueDictionary[key];
      if (mappedKey) {
        acc[mappedKey] = value;
      }
      return acc;
    }, {});

  const mappedMetadata = mapMetadataToDictionary(metadataImg);
  mappedMetadata.hospitalId = accountid; 
  const escapeODataString = value => String(value).replace(/'/g, "''");
  try {
    const token = await tokenService.getToken();
    if (!token) {
      throw new Error('Unable to obtain Dataverse access token.');
    }

    const dataverseClient = axios.create({
      baseURL: dataverseApiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'return=representation',
      },
    });

    const createPayload = {
      kmo_uuid: kmo_UUID,
      kmo_message: JSON.stringify(mappedMetadata || {})
    };

    let response;
    try {
      const entitySetName = 'kmo_series';
      const escapedKmoUuid = escapeODataString(kmo_UUID);
      response = await dataverseClient.patch(
        `/${entitySetName}(kmo_uuid='${escapedKmoUuid}')`,
        createPayload
      );
    } catch (requestError) {
      const status = requestError.response?.status || 502;
      const responseData = requestError.response?.data;
      const message = responseData?.error?.message || requestError.message || 'Dataverse request failed.';

      console.error('Dataverse request failed:', {
        status,
        message,
        data: responseData,
      });

      return res.status(status).json({
        message: 'Failed to save metadata to Dataverse.',
        error: message,
        dataverseStatus: status,
        dataverseResponse: responseData,
      });
    }

    const data = response.data;
    const status = response.status;

    console.log('Dataverse response status:', status);
    console.log('Dataverse response data:', data);
    console.log('accountid:' + accountid);
    console.log(keyValueDictionary['x00100010'], metadataImg?.x00100010);
    console.log(keyValueDictionary['x0020000d'], metadataImg?.x0020000d);

    res.status(status || 201).json({
      message: 'Metadata inserted to series.',
      dataverseStatus: status,
      dataverseResponse: data,
    });
  } catch (error) {
    console.error('Error saving metadata:', error);
    res.status(500).json({ message: 'Failed to save metadata.', error: error.message });
  }
};

module.exports = {
  manageScreenShot,
  manageUploads,
};
