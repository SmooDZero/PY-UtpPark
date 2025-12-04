// 1. Apuntar al puerto de Python (Cerebro)
const API_URL = 'http://127.0.0.1:5000'; 

// =========================================================
// GESTIÓN DE SESIÓN (COOKIES)
// =========================================================

/**
 * Pregunta al servidor: "¿Sigo logueado?"
 * Se usa al cargar la página para saber si mostrar el Dashboard o redirigir.
 */
async function checkSession() {
    try {
        // Petición a /me enviando la cookie
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            credentials: 'include' // <--- CLAVE: Envía la cookie
        });

        if (!response.ok) {
            // Si el servidor dice 401 (No autorizado) y no estamos en el login...
            if (window.location.pathname !== '/login.html') {
                window.location.href = '/login.html';
            }
            return null;
        }

        const data = await response.json();
        return data.user; // Retorna { nombre, rol, etc }

    } catch (error) {
        console.error("Error verificando sesión:", error);
        return null;
    }
}

/**
 * Cierra la sesión en el servidor (borra la cookie)
 */
async function logout() {
    try {
        await authenticatedFetch('/logout', { method: 'POST' });
    } catch (error) {
        console.error("Error al salir:", error);
    } finally {
        // Pase lo que pase, nos vamos al login
        window.location.href = '/login.html';
    }
}

// =========================================================
// FETCH CENTRALIZADO (CONECTOR)
// =========================================================

/**
 * Reemplazo de fetch estándar.
 * 1. Agrega la URL base (http://127.0.0.1:5000)
 * 2. Agrega credentials: 'include' automáticamente
 * 3. Maneja errores de sesión (401)
 */
async function authenticatedFetch(endpoint, options = {}) {
    const config = {
        ...options,
        credentials: 'include', // Envía cookies automáticamente
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    try {
        // NOTA: Aquí unimos URL + Endpoint directamente (sin /api extra)
        // Ej: http://127.0.0.1:5000/admin/dashboard-stats
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Si la sesión expiró mientras navegabas
        if (response.status === 401) {
            window.location.href = '/login.html';
            return null;
        }

        return response;
    } catch (error) {
        console.error(`Error conectando a ${endpoint}:`, error);
        return null;
    }
}

// =========================================================
// AUTO-VERIFICACIÓN INICIAL
// =========================================================
// Si no estamos en el login, verificamos sesión inmediatamente
if (window.location.pathname !== '/login.html') {
    // No llamamos a checkSession aquí directamente para no bloquear,
    // index.js lo llamará en su función init().
}