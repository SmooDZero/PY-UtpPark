// === Mostrar / ocultar menú en móvil ===
const menuToggle = document.getElementById("menu-toggle");
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const nav = document.getElementById("navbar");
    if (nav) nav.classList.toggle("active");
  });
}

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";

  togglePassword.className = isHidden ? "fas fa-eye-slash" : "fas fa-eye";

  togglePassword.style.transform = "scale(1.2)";
  setTimeout(() => (togglePassword.style.transform = "scale(1)"), 150);
});


// === Validación del formulario ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const mensaje = document.getElementById("mensaje"); // <p id="mensaje"></p> opcional

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = document.getElementById("usuario").value.trim();
      const password = document.getElementById("password").value.trim();

      if (usuario === "" || password === "") {
        if (mensaje) mensaje.textContent = "Por favor, complete todos los campos.";
        return;
      }

      // Validaciones UTP
      if (/^[CU]\d+$/.test(usuario)) {
        // Diferenciar tipo de usuario
        if (usuario.startsWith("C")) {
          if (mensaje) mensaje.textContent = "Bienvenido Profesor 👨‍🏫";
        } else if (usuario.startsWith("U")) {
          if (mensaje) mensaje.textContent = "Bienvenido Estudiante 👨‍🎓";
        }

        // Redirigir a index.html
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        if (mensaje) mensaje.textContent = "Código UTP no válido. Ejemplo: U12345678";
      }
    });
  }
});

