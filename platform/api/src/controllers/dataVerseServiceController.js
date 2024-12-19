const bodyParser = require('body-parser');
const tokenService = require('../services/tokenService');
const keyValueDictionary = require('../utils/keyValueDictionary');

const fs = require('fs');
const path = require('path');

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
  const { metadataImg, accountid } = req.body;

  try {
    let token = await tokenService.getToken();
    console.log(token);
    /**
     * Hacer algo con la metadata
     */

    let obj = JSON.parse(JSON.stringify(metadataImg));

    console.log('accountid:' + accountid);
    console.log(keyValueDictionary['x00100010'], obj.x00100010);
    console.log(keyValueDictionary['x0020000d'], obj.x0020000d);

    res.status(201).json({ message: 'Metadata received!' });
  } catch (error) {
    console.error('Error saving metadata:', error);
    res.status(500).json({ message: 'Failed to save metadata.', error: error.message });
  }
};

module.exports = {
  manageScreenShot,
  manageUploads,
};
