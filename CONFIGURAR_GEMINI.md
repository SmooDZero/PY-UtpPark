# 🤖 Configurar Google Gemini para el Chatbot

## 📋 Pasos para Obtener tu API Key Gratuita

### 1. Crear cuenta en Google AI Studio

1. Ve a: **https://makersuite.google.com/app/apikey**
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Create API Key"** o **"Get API Key"**
4. Selecciona un proyecto (o crea uno nuevo)
5. Copia tu API Key (se verá algo como: `AIzaSy...`)

### 2. Configurar en el Proyecto

1. **Crea el archivo `.env`** en la raíz del proyecto (si no existe):
   ```bash
   cp .env.example .env
   ```

2. **Abre el archivo `.env`** y agrega tu API key:
   ```
   GEMINI_API_KEY=tu_api_key_aqui
   ```

3. **Reinicia el servidor**:
   ```bash
   npm start
   ```

### 3. Verificar que Funciona

1. Abre el sistema en tu navegador
2. Inicia sesión
3. Ve a la sección "Chatbot" o "Asistente Virtual"
4. Haz una pregunta
5. Si ves respuestas más naturales y contextuales, ¡Gemini está funcionando!

---

## ✅ Verificación

Cuando inicies el servidor, deberías ver uno de estos mensajes:

- **✅ Google Gemini inicializado correctamente** → Todo funciona
- **⚠️ Google Gemini no configurado** → No hay API key, usará respuestas estáticas
- **⚠️ Error al inicializar Google Gemini** → Revisa tu API key

---

## 🔒 Seguridad

**IMPORTANTE:**
- ❌ **NUNCA** subas el archivo `.env` a GitHub o repositorios públicos
- ✅ El archivo `.env` ya está en `.gitignore` para proteger tu API key
- ✅ Mantén tu API key privada y no la compartas

---

## 📊 Límites del Plan Gratuito

Google Gemini Free Tier incluye:
- **15 solicitudes por minuto (RPM)**
- **1,500 solicitudes por día (RPD)**
- **1,000,000 tokens por minuto**

Esto es más que suficiente para un sistema de estacionamiento universitario.

---

## 🐛 Solución de Problemas

### Error: "API key not valid"
- Verifica que copiaste la API key completa
- Asegúrate de que no hay espacios antes o después
- Verifica que la API key esté activa en Google AI Studio

### El chatbot sigue usando respuestas estáticas
- Verifica que el archivo `.env` existe y tiene `GEMINI_API_KEY=...`
- Reinicia el servidor después de agregar la API key
- Revisa los mensajes en la consola del servidor

### Error: "Quota exceeded"
- Has alcanzado el límite del plan gratuito
- Espera hasta el siguiente día o considera actualizar el plan
- El sistema automáticamente usará respuestas estáticas como fallback

---

## 💡 Ventajas de Usar Gemini

✅ **Respuestas más naturales** - Entiende el contexto y responde de forma conversacional
✅ **Mejor comprensión** - Entiende preguntas formuladas de diferentes maneras
✅ **Información contextual** - Puede relacionar conceptos y dar respuestas más completas
✅ **Fallback automático** - Si Gemini falla, usa respuestas estáticas

---

**¡Listo! Tu chatbot ahora está impulsado por IA de Google Gemini.** 🚀

