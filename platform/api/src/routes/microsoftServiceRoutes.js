// src/routes/microsoftServiceRoutes.js
const express = require('express');
const { appLogin } = require('../controllers/microsoftServiceController');

const router = express.Router();

// Ruta para el login de la API Microsoft
router.post('/appLogin', appLogin);

module.exports = router;
