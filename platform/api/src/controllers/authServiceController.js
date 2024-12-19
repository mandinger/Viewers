const qs = require('qs');
require('dotenv').config();

const { microsoftInstance } = require('../config/axios');

// Función para obtener el token de Microsoft
const appLogin = async (req, res) => {
  const _clientId = process.env.CLIENT_ID_MICROSOFT;
  const _clientSecret = process.env.CLIENT_SECRET_MICROSOFT;
  const _grantType = process.env.GRANT_TYPE_MICROSOFT;
  const _scope = process.env.SCOPE_MICROSOFT;
  const _resource = process.env.RESOURCE_MICROSOFT;

  const params = {
    client_id: _clientId,
    client_secret: _clientSecret,
    grant_type: _grantType,
    resource: _resource,
    scope: _scope,
  };

  try {
    const response = await microsoftInstance.post('/', params);
    //console.log('response: ' + JSON.stringify(response.data));
    if (response.status != 200) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    // Retornar el token
    res.json(response.data);
  } catch (error) {
    console.error('Error obtaining token:', error);
    res.status(500).json({ error: 'Unable to obtain access token.' });
  }
};

module.exports = {
  appLogin,
};
