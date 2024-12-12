const axios = require('axios');

const _tenantIdMicrosoft = process.env.TENANT_ID_MICROSOFT;
const _tenantIdDataVerse = process.env.TENANT_ID_DATAVERSE;
const _urlLoguinMicrosoft = process.env.URL_LOGIN_MICROSOFT.replace('tenantId', _tenantIdMicrosoft);
const _urlLoguinDataverse = process.env.URL_LOGIN_DATAVERSE.replace('tenantId', _tenantIdDataVerse);

const microsoftInstance = axios.create({
  baseURL: _urlLoguinMicrosoft, // Base URL de la API
  timeout: 5000, // Tiempo de espera
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/dicom+json',
  },
});

const dataverseInstance = axios.create({
  baseURL: _urlLoguinDataverse, // Base URL de la API
  timeout: 5000, // Tiempo de espera
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/dicom+json',
  },
});

module.exports = { microsoftInstance, dataverseInstance };
