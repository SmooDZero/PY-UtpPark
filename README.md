# Park UTP - Sistema de Gestión de Estacionamiento

Sistema completo de gestión de estacionamiento para la Universidad Tecnológica del Perú (UTP) con chatbot AI, notificaciones automáticas y gestión de espacios.

## 🚀 Características

- ✅ **Autenticación de usuarios** con base de datos SQLite
- ✅ **Gestión de vehículos** (registro y asignación)
- ✅ **Panel de gestor** para asignar espacios de estacionamiento
- ✅ **Panel de usuarios** (docentes, alumnos, administrativos, visitantes) para ver disponibilidad
- ✅ **Chatbot con IA (Google Gemini)** que responde preguntas sobre reglas de estacionamiento y reglamento de tránsito
- ✅ **Sistema híbrido**: Usa IA cuando está configurada, respuestas estáticas como fallback
- ✅ **Sistema de notificaciones** automáticas sobre disponibilidad y normas
- ✅ **Interfaz responsive** similar al diseño original

## 📋 Requisitos

- Node.js 14+ instalado
- npm o yarn

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Inicializar base de datos:**
```bash
npm run init-db
```

Esto creará:
- Tablas necesarias
- Usuarios de ejemplo:
  - **Gestor:** G001 / admin123
  - **Docente:** C123456 / docente123
  - **Alumno:** U22238381 / alumno123

3. **Configurar variables de entorno (opcional):**
```bash
# Crea el archivo .env
PORT=3000
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
GEMINI_API_KEY=tu_api_key_aqui  # Opcional: para habilitar IA en el chatbot
```

**Para habilitar el chatbot con IA:**
- Obtén una API key gratuita de Google Gemini: https://makersuite.google.com/app/apikey
- Agrega `GEMINI_API_KEY=tu_api_key` en el archivo `.env`
- Si no configuras la API key, el chatbot usará respuestas estáticas (también funciona)
- Ver instrucciones detalladas en `CONFIGURAR_GEMINI.md`

## 🎯 Ejecutar el Proyecto

### Modo Desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor estará disponible en: **http://localhost:3000**

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── database/
│   │   ├── db.js          # Conexión a SQLite
│   │   └── init.js        # Inicialización de BD
│   ├── middleware/
│   │   └── auth.js        # Autenticación JWT
│   ├── routes/
│   │   ├── auth.js         # Login/Registro
│   │   ├── users.js        # Perfil y vehículos
│   │   ├── parking.js      # Gestión de espacios (gestor)
│   │   ├── chatbot.js      # Chatbot AI
│   │   └── notifications.js # Notificaciones
│   └── server.js          # Servidor Express
├── frontend/
│   ├── css/
│   │   ├── index.css
│   │   └── login.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── login.js
│   │   ├── index.js
│   │   ├── dashboard.js    # Dashboard usuarios
│   │   ├── gestor.js      # Dashboard gestor
│   │   ├── chatbot.js
│   │   └── notifications.js
│   ├── img/
│   ├── index.html
│   └── login.html
└── package.json
```

## 👥 Tipos de Usuario

### Gestor
- Asignar espacios a usuarios
- Crear nuevos espacios
- Liberar espacios
- Ver estadísticas
- Acceso al chatbot

### Usuarios (Docentes, Alumnos, Administrativos, Visitantes)
- Ver disponibilidad de espacios
- Registrar vehículo
- Ver notificaciones
- Consultar chatbot
- Ver perfil

## 🤖 Chatbot con IA

El chatbot está **impulsado por Google Gemini** (opcional) y responde preguntas sobre:
- Horarios del estacionamiento
- Reglas de uso
- Normas de tránsito
- Requisitos y documentación
- Y más...

**Características:**
- ✅ **IA Real**: Usa Google Gemini para respuestas inteligentes y contextuales
- ✅ **Sistema Híbrido**: Si no hay API key, usa respuestas estáticas
- ✅ **Fallback Automático**: Si la IA falla, usa respuestas predefinidas
- ✅ **Gratuito**: Plan gratuito de Gemini es suficiente para el uso normal

**Ejemplos de preguntas:**
- "¿Cuáles son los horarios del estacionamiento?"
- "¿Puedo reservar un espacio?"
- "¿Cuál es la velocidad máxima permitida?"
- "¿Qué documentos necesito?"
- "Explícame las reglas de estacionamiento para motos"

**Configuración:**
Ver `CONFIGURAR_GEMINI.md` para obtener tu API key gratuita.

## 🔔 Notificaciones

El sistema envía notificaciones automáticas:
- **Disponibilidad:** Cuando quedan pocos espacios disponibles (<20%)
- **Normas:** Recordatorios diarios sobre reglas de estacionamiento y tránsito
- **Recordatorios:** Información importante sobre el uso del estacionamiento

## 🗄️ Base de Datos

La base de datos SQLite se crea automáticamente en `backend/database/parking.db` con las siguientes tablas:

- `users` - Usuarios del sistema
- `vehiculos` - Vehículos registrados
- `espacios` - Espacios de estacionamiento
- `asignaciones` - Asignaciones de espacios
- `notificaciones` - Notificaciones del sistema
- `chatbot_history` - Historial de conversaciones del chatbot

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación. Los tokens expiran después de 24 horas.

## 📱 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `POST /api/users/vehiculo` - Registrar vehículo
- `GET /api/users/espacios/disponibilidad` - Ver disponibilidad

### Parking (Gestor)
- `GET /api/parking/espacios` - Listar espacios
- `POST /api/parking/espacios` - Crear espacio
- `POST /api/parking/asignar` - Asignar espacio
- `POST /api/parking/liberar/:id` - Liberar espacio
- `GET /api/parking/usuarios` - Listar usuarios con vehículos

### Chatbot
- `POST /api/chatbot/pregunta` - Hacer pregunta
- `GET /api/chatbot/historial` - Ver historial

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones
- `PUT /api/notifications/:id/leida` - Marcar como leída
- `GET /api/notifications/no-leidas` - Contar no leídas

## 🛠️ Desarrollo

### Agregar nuevos espacios:
El gestor puede crear espacios desde la interfaz o directamente en la base de datos.

### Personalizar chatbot:
Edita `backend/routes/chatbot.js` para agregar más reglas y respuestas.

### Modificar notificaciones:
Edita `backend/routes/notifications.js` para cambiar la frecuencia y contenido de las notificaciones.

## 📝 Notas

- La base de datos se crea automáticamente al ejecutar `npm run init-db`
- Los usuarios de ejemplo tienen contraseñas simples (cambiar en producción)
- El secreto JWT debe cambiarse en producción (variable `JWT_SECRET` en `.env`)
- El sistema está diseñado para desarrollo; para producción, considera usar PostgreSQL o MySQL

## 🐛 Solución de Problemas

**Error: "Cannot find module"**
```bash
npm install
```

**Error de base de datos:**
```bash
npm run init-db
```

**Puerto en uso:**
Cambia el puerto en `.env` o en `backend/server.js`

## 📄 Licencia

Este proyecto es para uso educativo.

---

**Desarrollado para UTP - Sistema de Gestión de Estacionamiento**
