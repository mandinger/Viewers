// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const microsoftServiceRoutes = require('./routes/microsoftServiceRoutes');
require('dotenv').config(); // Cargar variables de entorno del archivo .env

const app = express();
const PORT = process.env.PORT;

// Middleware para parsear el cuerpo de la solicitud
app.use(bodyParser.json());

// Usar las rutas definidas en microsoftServiceRoutes
app.use('/microsoftservice', microsoftServiceRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
