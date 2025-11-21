# 🚀 Cómo Ejecutar el Proyecto - Paso a Paso

## ✅ Verificación Inicial

Ya tienes Node.js instalado (v24.11.1) y npm (11.6.2). ¡Perfecto!

---

## 📋 Pasos para Ejecutar

### **IMPORTANTE:** Abre una NUEVA ventana de PowerShell o CMD

1. **Abre PowerShell o CMD como administrador** (opcional, pero recomendado)

2. **Navega a la carpeta del proyecto:**
```powershell
cd "C:\Users\Bruce\Downloads\PY-UtpPark-main"
```

3. **Verifica que Node.js funciona:**
```powershell
node --version
npm --version
```
Deberías ver: `v24.11.1` y `11.6.2`

4. **Instala las dependencias (PRIMERA VEZ):**
```powershell
npm install
```
Esto tomará 1-2 minutos. Verás muchos mensajes de descarga.

5. **Inicializa la base de datos (PRIMERA VEZ):**
```powershell
npm run init-db
```
Deberías ver mensajes como:
- "🔄 Inicializando base de datos..."
- "✅ Base de datos inicializada correctamente"
- Lista de usuarios de ejemplo

6. **Inicia el servidor:**
```powershell
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
📱 Frontend disponible en http://localhost:3000
✅ Conectado a la base de datos SQLite
```

7. **Abre tu navegador en:**
```
http://localhost:3000
```

---

## 🔑 Credenciales para Iniciar Sesión

Una vez que el servidor esté corriendo:

- **Gestor:** `G001` / `admin123`
- **Docente:** `C123456` / `docente123`
- **Alumno:** `U22238381` / `alumno123`

---

## ⚠️ Si npm no se reconoce

Si al abrir una nueva ventana PowerShell aún dice que npm no se reconoce:

1. **Cierra TODAS las ventanas de PowerShell/CMD**
2. **Reinicia tu computadora** (esto actualiza las variables de entorno)
3. **O agrega Node.js al PATH manualmente:**
   - Busca "Variables de entorno" en Windows
   - Agrega la ruta de Node.js al PATH del sistema
   - Generalmente está en: `C:\Program Files\nodejs\`

---

## 🎯 Comandos Rápidos (Después de la Primera Instalación)

Una vez que hayas ejecutado `npm install` y `npm run init-db` la primera vez, solo necesitas:

```powershell
npm start
```

---

## 🐛 Solución de Problemas

### Error: "npm no se reconoce"
- **Solución:** Abre una NUEVA ventana de PowerShell/CMD
- O reinicia tu computadora

### Error: "Cannot find module"
- **Solución:** Ejecuta `npm install` nuevamente

### Error: "Port 3000 already in use"
- **Solución:** Cierra otros programas que usen el puerto 3000
- O cambia el puerto en `backend/server.js`

### El servidor se cierra inmediatamente
- Revisa los mensajes de error en la consola
- Verifica que todas las dependencias estén instaladas

---

## ✅ Checklist

- [ ] Node.js instalado (v24.11.1) ✓
- [ ] npm instalado (11.6.2) ✓
- [ ] Abriste NUEVA ventana PowerShell/CMD
- [ ] Navegaste a la carpeta del proyecto
- [ ] Ejecutaste `npm install`
- [ ] Ejecutaste `npm run init-db`
- [ ] Ejecutaste `npm start`
- [ ] Abriste http://localhost:3000 en el navegador

---

**¡Una vez que veas el mensaje "Servidor corriendo en http://localhost:3000", el proyecto está funcionando!** 🎉

