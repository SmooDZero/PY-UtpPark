// === ELEMENTOS ===
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuList = document.getElementById('menuList');
const mainContent = document.getElementById('mainContent');
const userDropdown = document.getElementById('userDropdown');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const userCode = document.getElementById('userCode');
const sidebarName = document.getElementById('sidebarName');
const sidebarCode = document.getElementById('sidebarCode');
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnMobile = document.getElementById('logoutBtnMobile');

// Verificar autenticación
requireAuth();

// Cargar información del usuario
const user = getUser();
if (user) {
  userName.textContent = user.nombre || 'Usuario';
  userCode.textContent = user.codigo || '-';
  sidebarName.textContent = user.nombre || 'Usuario';
  sidebarCode.textContent = user.codigo || '-';
}

// === MENÚ DINÁMICO SEGÚN TIPO DE USUARIO ===
function buildMenu() {
  const user = getUser();
  if (!user) return;

  const menuItems = [];

  if (user.tipo === 'gestor') {
    menuItems.push(
      { icon: 'fas fa-th-large', text: 'Dashboard', section: 'dashboard' },
      { icon: 'fas fa-parking', text: 'Gestión de Espacios', section: 'espacios' },
      { icon: 'fas fa-users', text: 'Usuarios', section: 'usuarios' },
      { icon: 'fas fa-chart-bar', text: 'Estadísticas', section: 'estadisticas' },
      { icon: 'fas fa-robot', text: 'Chatbot', section: 'chatbot' }
    );
  } else {
    menuItems.push(
      { icon: 'fas fa-th-large', text: 'Inicio', section: 'inicio' },
      { icon: 'fas fa-parking', text: 'Disponibilidad', section: 'disponibilidad' },
      { icon: 'fas fa-car', text: 'Mi Vehículo', section: 'vehiculo' },
      { icon: 'fas fa-robot', text: 'Asistente Virtual', section: 'chatbot' }
    );
  }

  menuList.innerHTML = menuItems.map((item, index) => `
    <li class="menu-item ${index === 0 ? 'active' : ''}" data-section="${item.section}">
      <span class="active-bar"></span>
      <a href="#" class="menu-link">
        <i class="${item.icon}"></i>
        <span>${item.text}</span>
      </a>
    </li>
  `).join('');

  // Agregar event listeners
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      
      // Cerrar modales abiertos al cambiar de sección
      const chatbotModal = document.getElementById('chatbotModal');
      if (chatbotModal) chatbotModal.classList.add('hidden');
      const notificationsModal = document.getElementById('notificationsModal');
      if (notificationsModal) notificationsModal.classList.add('hidden');
      
      // Llamar a loadSection si está disponible
      if (typeof window.loadSection === 'function') {
        window.loadSection(section);
      } else {
        console.warn('loadSection no está disponible aún');
      }
      
      // Actualizar menú activo
      document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');

      // Cerrar sidebar en móvil
      if (window.innerWidth < 992) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        hamburger.classList.remove('active');
        document.querySelector('.left-group').classList.remove('expanded');
      }
    });
  });

  // Cargar sección inicial - la función loadSection está en dashboard.js o gestor.js
  // Se cargará automáticamente cuando esos scripts se ejecuten
  const firstSection = menuItems[0].section;
  if (firstSection && typeof window.loadSection === 'function') {
    window.loadSection(firstSection);
  }
}

// === ABRIR / CERRAR SIDEBAR ===
hamburger.addEventListener('click', () => {
  if (window.innerWidth < 992) {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden', !isOpen);
    hamburger.classList.toggle('active', isOpen);
    document.querySelector('.left-group').classList.toggle('expanded', isOpen);
  }
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.add('hidden');
  hamburger.classList.remove('active');
  document.querySelector('.left-group').classList.remove('expanded');
});

// === MENÚ USUARIO ===
let userMenuOpen = false;
if (userDropdown) {
  userDropdown.addEventListener('click', (ev) => {
    ev.stopPropagation();
    userMenuOpen = !userMenuOpen;
    userDropdown.classList.toggle('open', userMenuOpen);
    userMenu.style.display = userMenuOpen ? 'flex' : 'none';
  });
}

document.addEventListener('click', () => {
  if (userMenuOpen) {
    userDropdown.classList.remove('open');
    userMenu.style.display = 'none';
    userMenuOpen = false;
  }
});

// === LOGOUT ===
function logout() {
  removeToken();
  window.location.href = '/login.html';
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);
if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', logout);

// === ESCAPE PARA CERRAR TODO ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
    hamburger.classList.remove('active');
    document.querySelector('.left-group').classList.remove('expanded');

    if (userMenuOpen) {
      userDropdown.classList.remove('open');
      userMenu.style.display = 'none';
      userMenuOpen = false;
    }
  }
});

// === RESPONSIVE ===
function updateHamburgerState() {
  const isDesktop = window.innerWidth >= 992;
  if (isDesktop) {
    hamburger.style.pointerEvents = 'none';
    hamburger.classList.remove('active');
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
    document.querySelector('.left-group').classList.remove('expanded');
  } else {
    hamburger.style.pointerEvents = 'auto';
  }
}

window.addEventListener('resize', updateHamburgerState);
updateHamburgerState();

// === CARGA INICIAL ===
buildMenu();

// Importar funciones de auth.js
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
  }
}

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function removeToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

