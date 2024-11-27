// src/index.js
const express = require('express');
const bodyParser = require('body-parser');

const microsoftServiceRoutes = require('./routes/microsoftServiceRoutes');
const dataVerseServiceRoutes = require('./routes/dataVerseServiceRoutes');

const cors = require('cors');

// Cargar variables de entorno del archivo .env
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

const allowedOrigins = ['http://localhost:3000', 'https://eimaging-ohif.azureedge.net'];
//incremento para recibir imagenes
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

// Middleware para parsear el cuerpo de la solicitud
app.use(bodyParser.json());

// Definicion de rutas
app.use('/microsoftservice', microsoftServiceRoutes);
app.use('/dataVerseService', dataVerseServiceRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
