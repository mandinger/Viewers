const qs = require('qs');
require('dotenv').config();

// Función para obtener el token de Microsoft
const appLogin = async (req, res) => {
  const _clientId = process.env.CLIENT_ID_MICROSOFT;
  const _clientSecret = process.env.CLIENT_SECRET_MICROSOFT;
  const _tenantId = process.env.TENANT_ID_MICROSOFT;
  const _grantType = process.env.GRANT_TYPE_MICROSOFT;
  const _scope = process.env.SCOPE_MICROSOFT;
  const _resource = process.env.RESOURCE_MICROSOFT;
  let _urlLoguin = process.env.URL_LOGIN_MICROSOFT;

  const params = {
    client_id: _clientId,
    client_secret: _clientSecret,
    grant_type: _grantType,
    resource: _resource,
    scope: _scope,
  };

  try {
    _urlLoguin = _urlLoguin.replace('tenantId', _tenantId);
    const response = await fetch(_urlLoguin, {
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
    res.json(data);
  } catch (error) {
    console.error('Error al obtener el token:', error);
    res.status(500).json({ error: 'No se pudo obtener el token de acceso' });
  }
};

module.exports = {
  appLogin,
};
