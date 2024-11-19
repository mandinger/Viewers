// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const microsoftServiceRoutes = require('./routes/microsoftServiceRoutes');
const cors = require('cors');

// Cargar variables de entorno del archivo .env
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);

// Middleware para parsear el cuerpo de la solicitud
app.use(bodyParser.json());

// Definicion de rutas
app.use('/microsoftservice', microsoftServiceRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
