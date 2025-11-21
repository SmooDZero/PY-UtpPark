# 🚀 Instrucciones de Instalación - Park UTP

## ⚠️ PROBLEMA DETECTADO

**Node.js no está instalado en tu sistema.** Este proyecto requiere Node.js para funcionar.

---

## 📥 PASO 1: Instalar Node.js

### Opción A: Descarga Directa (Recomendado)

1. **Ve a la página oficial de Node.js:**
   - https://nodejs.org/
   - O directamente: https://nodejs.org/es/download/

2. **Descarga la versión LTS (Long Term Support):**
   - Recomendado: **Node.js 18.x o 20.x LTS**
   - Elige la versión para Windows (64-bit)

3. **Ejecuta el instalador:**
   - Haz doble clic en el archivo descargado
   - Sigue el asistente de instalación
   - **IMPORTANTE:** Asegúrate de marcar la opción "Add to PATH" durante la instalación

4. **Verifica la instalación:**
   - Abre una nueva ventana de PowerShell o CMD
   - Ejecuta: `node --version`
   - Deberías ver algo como: `v20.x.x`
   - Ejecuta: `npm --version`
   - Deberías ver algo como: `10.x.x`

### Opción B: Usando Chocolatey (si lo tienes instalado)

```powershell
choco install nodejs-lts
```

### Opción C: Usando Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

---

## ✅ PASO 2: Verificar Instalación

Después de instalar Node.js, **cierra y vuelve a abrir** PowerShell o CMD, luego ejecuta:

```powershell
node --version
npm --version
```

Si ambos comandos muestran números de versión, ¡estás listo!

---

## 🎯 PASO 3: Ejecutar el Proyecto

Una vez que Node.js esté instalado:

### Opción 1: Usar el script .bat
```bash
# Haz doble clic en:
iniciar.bat
```

### Opción 2: Manual (paso a paso)

1. **Abre PowerShell o CMD en la carpeta del proyecto**

2. **Instala las dependencias:**
```bash
npm install
```

3. **Inicializa la base de datos:**
```bash
npm run init-db
```

4. **Inicia el servidor:**
```bash
npm start
```

5. **Abre tu navegador en:**
```
http://localhost:3000
```

---

## 🔑 Credenciales de Prueba

Una vez que el servidor esté corriendo, puedes iniciar sesión con:

- **Gestor:** `G001` / `admin123`
- **Docente:** `C123456` / `docente123`
- **Alumno:** `U22238381` / `alumno123`

---

## ❓ Solución de Problemas

### "El término 'node' no se reconoce"
- **Solución:** Node.js no está instalado o no está en el PATH
- Reinstala Node.js asegurándote de marcar "Add to PATH"
- Reinicia tu terminal después de instalar

### "npm install" falla
- Verifica tu conexión a internet
- Intenta: `npm install --verbose` para ver más detalles

### El servidor no inicia
- Verifica que el puerto 3000 no esté en uso
- Cambia el puerto en `backend/server.js` o crea un archivo `.env`

### El .bat se cierra inmediatamente
- Abre PowerShell o CMD manualmente
- Navega a la carpeta del proyecto: `cd "C:\Users\Bruce\Downloads\PY-UtpPark-main"`
- Ejecuta los comandos manualmente (ver Opción 2 arriba)

---

## 📞 ¿Necesitas Ayuda?

Si después de instalar Node.js sigues teniendo problemas:

1. Verifica que Node.js esté instalado: `node --version`
2. Verifica que npm esté instalado: `npm --version`
3. Asegúrate de estar en la carpeta correcta del proyecto
4. Ejecuta los comandos manualmente en lugar del .bat

---

**¡Una vez instalado Node.js, el proyecto funcionará perfectamente!** 🎉

