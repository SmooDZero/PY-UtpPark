// 1. CAMBIO: Apuntar directamente al Backend Python
const API_URL = 'http://127.0.0.1:5000';

const usuario = document.getElementById("usuario");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const togglePassword = document.getElementById("togglePassword");
const errorMessage = document.getElementById("errorMessage");
const loginForm = document.getElementById("loginForm");

// Habilitar botón solo cuando hay texto
document.addEventListener("input", () => {
  if (usuario && password && loginBtn) {
    loginBtn.disabled = !(usuario.value.trim() && password.value.trim());
    loginBtn.classList.toggle("active", !loginBtn.disabled);
  }
});

// Mostrar / ocultar contraseña
if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);
    togglePassword.classList.toggle("fa-eye-slash");
  });
}

// Login Principal
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const codigo = usuario.value.trim();
    const pass = password.value.trim();

    if (!codigo || !pass) {
      showError("Por favor, complete todos los campos.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Iniciando sesión...";

    try {
      // 2. CAMBIO: Fetch configurado para Cookies
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // <--- IMPORTANTE: Permite guardar la cookie de sesión
        body: JSON.stringify({ usuario: codigo, password: pass })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // 3. CAMBIO: Guardado híbrido
      // Aunque usamos cookies, guardamos esto en localStorage para que el 
      // código antiguo de dashboard.js (que busca 'user') no falle visualmente.
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al dashboard
      window.location.href = '/index.html';

    } catch (error) {
      console.error(error);
      showError(error.message || "Error de conexión con el servidor.");
      loginBtn.disabled = false;
      loginBtn.textContent = "Iniciar Sesión";
    }
  });
}

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 5000);
  } else {
    alert(message);
  }
}