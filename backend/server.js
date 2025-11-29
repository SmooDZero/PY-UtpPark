const express = require('express');
const cors = require('cors');
const path = require('path');

// CARGAR .env DESDE backend/.env SIEMPRE
require('dotenv').config({ path: __dirname + '/.env' });

console.log("DEBUG ENV KEY →", process.env.GEMINI_API_KEY);



const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const parkingRoutes = require('./routes/parking');
const chatbotRoutes = require('./routes/chatbot');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationsRoutes);

// Ruta para servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Frontend disponible en http://localhost:${PORT}`);
});


/*
================================================================
MANUAL DE EJECUCIÓN - SISTEMA DE ESTACIONAMIENTO INTELIGENTE
================================================================

IMPORTANTE: Se requieren dos terminales abiertas simultáneamente.

           --- TERMINAL 1: SERVICIO DE IA (PYTHON) ---
         1. Navegar al directorio raíz:
             > cd Chatbot-Innovaci-n

         2. Activar entorno virtual:
             > .\venv\Scripts\activate

         3. Iniciar el servicio API:
             > python -m parking_system.api

    [Estado Correcto]: Running on http://127.0.0.1:5000


             --- TERMINAL 2: APLICACIÓN WEB (NODE.JS) ---
          1. Navegar al directorio raíz:
             > cd PY-UtpPark

          2. Iniciar el servidor de desarrollo:
             > npm start

    [Estado Correcto]: Servidor corriendo en http://localhost:3000

                   --- ACCESO FINAL ---
            Abrir navegador en: http://localhost:3000

*/