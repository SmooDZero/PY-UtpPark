const API_URL = window.location.origin;

const usuario = document.getElementById("usuario");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const togglePassword = document.getElementById("togglePassword");
const errorMessage = document.getElementById("errorMessage");
const loginForm = document.getElementById("loginForm");

// Habilitar botón solo cuando hay texto
document.addEventListener("input", () => {
  loginBtn.disabled = !(usuario.value.trim() && password.value.trim());
  loginBtn.classList.toggle("active", !loginBtn.disabled);
});

// Mostrar / ocultar contraseña
togglePassword.addEventListener("click", () => {
  const type = password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);
  togglePassword.classList.toggle("fa-eye-slash");
});

// Login
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
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ codigo, password: pass })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || "Error al iniciar sesión");
      loginBtn.disabled = false;
      loginBtn.textContent = "Iniciar Sesión";
      return;
    }

    // Guardar token y usuario
    saveToken(data.token);
    saveUser(data.user);

    // Verificar si tiene vehículo
    if (!data.user.tieneVehiculo && data.user.tipo !== 'gestor') {
      // Redirigir a registro de vehículo
      window.location.href = '/index.html#vehiculo';
    } else {
      // Redirigir al dashboard
      window.location.href = '/index.html';
    }

  } catch (error) {
    showError("Error de conexión. Por favor, intenta nuevamente.");
    loginBtn.disabled = false;
    loginBtn.textContent = "Iniciar Sesión";
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 5000);
}

// Importar funciones de auth.js
function saveToken(token) {
  localStorage.setItem('token', token);
}

function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

