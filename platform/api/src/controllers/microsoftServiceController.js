// src/controllers/microsoftServiceController.js
const qs = require('qs');
require('dotenv').config();

// Función para obtener el token de Microsoft
const appLogin = async (req, res) => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;
  const grantType = process.env.GRANT_TYPE;
  const scope = process.env.SCOPE;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;

  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
    scope: scope,
  };

  try {
    console.log('clientId', clientId);
    console.log('clientSecret', clientSecret);
    console.log('scope', scope);
    console.log('tokenUrl', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/dicom+json',
      },
      body: qs.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Retornar el token
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Error al obtener el token:', error);
    res.status(500).json({ error: 'No se pudo obtener el token de acceso' });
  }
};

module.exports = {
  appLogin,
};
