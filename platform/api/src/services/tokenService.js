const qs = require('qs');
require('dotenv').config();

let tokenData = null;

const setToken = data => {
  tokenData = {
    accessToken: data.accessToken,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn,
    obtainedAt: Date.now(),
  };
};

const getToken = async () => {
  if (isTokenValid()) {
    return tokenData.accessToken;
  }

  await renewToken();
  return tokenData.access_token;
};

const isTokenValid = () => {
  if (!tokenData) {
    return false;
  }

  const currentTime = Date.now();
  const expiryTime = tokenData.obtainedAt + tokenData.expiresIn * 1000;

  return currentTime < expiryTime;
};

const renewToken = async () => {
  const _clientId = process.env.CLIENT_ID_DATAVERSE;
  const _clientSecret = process.env.CLIENT_SECRET_DATAVERSE;
  const _tenantId = process.env.TENANT_ID_DATAVERSE;
  const _grantType = process.env.GRANT_TYPE_DATAVERSE;
  const _scope = process.env.SCOPE_DATAVERSE;
  const _resource = process.env.RESOURCE_DATAVERSE;
  let _urlLoguin = process.env.URL_LOGIN_DATAVERSE;

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

    setToken({
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in,
    });
    return response;
  } catch (error) {
    console.error('Error al obtener el token:', error);
  }
};

module.exports = { setToken, getToken, isTokenValid };
