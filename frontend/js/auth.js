// Gestión de autenticación y tokens
const API_URL = window.location.origin;

// Guardar token en localStorage
function saveToken(token) {
  localStorage.setItem('token', token);
}

// Obtener token de localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Eliminar token
function removeToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Guardar información del usuario
function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Obtener información del usuario
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
  return !!getToken();
}

// Redirigir a login si no está autenticado
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
  }
}

// Obtener headers con token para peticiones API
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/*  Hacer petición autenticada
async function authenticatedFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  const response = await fetch(`${API_URL}/api${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expirado o inválido
    removeToken();
    window.location.href = '/login.html';
    return null;
  }

  return response;
}
*/
// ================================
// authenticatedFetch CORREGIDO
// ================================
async function authenticatedFetch(url, options = {}) {
  const token = getToken();

  // Headers base
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  // Solo agregar Authorization si SÍ existe un token real
  if (token && token !== "null" && token !== "") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${url}`, {
    ...options,
    headers
  });

  return response;
}

