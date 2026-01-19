// src/routes/microsoftServiceRoutes.js
const express = require('express');
const { appLogin, appLoginReadWrite } = require('../controllers/authServiceController');

const router = express.Router();

// Ruta para el login de la API Microsoft
router.post('/appLogin', appLogin);

// Ruta para el login con permisos de lectura y escritura
router.post('/appLoginReadWrite', appLoginReadWrite);

module.exports = router;
