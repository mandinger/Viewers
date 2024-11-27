const bodyParser = require('body-parser');
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
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid base64 format.' });
    }

    const extension = matches[1]; // Obtener la extensión (jpg, png, etc.)
    const fileName = `${teleconsultationID}.${extension}`;

    res.status(201).json({ message: 'Image uploaded successfully!', fileName });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ message: 'Failed to save image.', error: error.message });
  }
};

module.exports = {
  manageScreenShot,
};
