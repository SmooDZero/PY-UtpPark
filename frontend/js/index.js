// === ELEMENTOS ===

/*
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
¨*/
// === ELEMENTOS DEL DOM ===
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuList = document.getElementById('menuList');
const mainContent = document.getElementById('mainContent');
const userDropdown = document.getElementById('userDropdown');
const userMenu = document.getElementById('userMenu');

// Elementos de texto de usuario
const userNameElements = [document.getElementById('userName'), document.getElementById('sidebarName')];
const userCodeElements = [document.getElementById('userCode'), document.getElementById('sidebarCode')];

// Botones
const logoutBtns = [document.getElementById('logoutBtn'), document.getElementById('logoutBtnMobile')];

// === FUNCIÓN PRINCIPAL DE INICIO ===
// En frontend/js/index.js

async function init() {
    // 1. Verificar sesión con el Backend
    const user = await checkSession();

    // 2. Lógica de Seguridad (EL CAMBIO IMPORTANTE)
    if (!user) {
        // Si no hay usuario válido, forzamos la redirección y detenemos todo
        window.location.href = '/login.html';
        return; 
    }

    // 3. Si llegamos aquí, es porque hay usuario. Cargamos la interfaz.
    updateUI(user);
    buildMenu(user);
    document.body.classList.add('loaded'); // Mostrar la página
}

// Actualizar textos en la interfaz
function updateUI(user) {
  // Python nos devuelve: nombre, email, codigo, tipo
  const nombreMostrar = user.nombre || 'Usuario';
  const codigoMostrar = user.codigo || user.dni || '-';

  userNameElements.forEach(el => { if(el) el.textContent = nombreMostrar; });
  userCodeElements.forEach(el => { if(el) el.textContent = codigoMostrar; });
}

// === MENÚ DINÁMICO SEGÚN TIPO DE USUARIO ===
// === CONFIGURACIÓN DE ROLES (IDs Numéricos de tu Base de Datos) ===
const ROLES = {
    ADMIN: 1,
    ALUMNO: 2,
    DOCENTE: 3,
    GESTOR: 4
};

// === MENÚ DINÁMICO SEGÚN ROL ===
function buildMenu(user) {
    // Leemos el rol. Puede venir como 'rol' (número) o 'tipo' (texto antiguo)
    // Convertimos a entero para asegurar la comparación.
    const userRole = parseInt(user.rol); 

    const menuItems = [];

    // --- LÓGICA DE PERMISOS ---
    
    // CASO 1: ADMINISTRADOR (Menú Personalizado)
    if (userRole === ROLES.ADMIN) {
        menuItems.push(
            { icon: 'fas fa-chart-line', text: 'Operación y Uso', section: 'dashboard' },
            { icon: 'fas fa-exclamation-triangle', text: 'Alertas de "Mal Uso"', section: 'alertas' },
            { icon: 'fas fa-users-cog', text: 'Gestión de Usuarios', section: 'usuarios' }
        );
    }
    else if (userRole === ROLES.GESTOR) {
        menuItems.push(
            // Eliminamos Dashboard y Estadísticas para el Gestor
            { icon: 'fas fa-parking', text: 'Gestión de Espacios', section: 'espacios' },
            
        );
    }

    // CASO 2: Alumnos y Docentes (Usuarios normales)
    else if (userRole === ROLES.ALUMNO || userRole === ROLES.DOCENTE) {
        menuItems.push(
            // 1. "Mi Pase": Es la pantalla 'inicio' con el Carnet y el Semáforo
            { icon: 'fas fa-id-card', text: 'Mi Pase', section: 'inicio' },
            
            // 2. "Mi Vehículo": Para ver su placa y estado
            { icon: 'fas fa-car', text: 'Mi Vehículo', section: 'vehiculo' },
            
            // 3. "Asistente": Pantalla dedicada al chat
            { icon: 'fas fa-robot', text: 'Asistente Virtual', section: 'chatbot' }
        );
    }
    // CASO 3: Rol desconocido o error
    else {
        console.warn("Rol desconocido detectado:", userRole);
        menuItems.push(
            { icon: 'fas fa-exclamation-circle', text: 'Sin Acceso', section: 'inicio' }
        );
    }

    // --- RENDERIZADO (IGUAL QUE ANTES) ---
    if (menuList) {
        menuList.innerHTML = menuItems.map((item, index) => `
            <li class="menu-item ${index === 0 ? 'active' : ''}" data-section="${item.section}">
                <span class="active-bar"></span>
                <a href="#" class="menu-link">
                    <i class="${item.icon}"></i>
                    <span>${item.text}</span>
                </a>
            </li>
        `).join('');

        // Event Listeners (Esto se mantiene igual, no lo toques)
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                
                handleNavigation(section);
                
                document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
                closeSidebar();
            });
        });

        // Cargar primera sección
        if (menuItems.length > 0) {
            handleNavigation(menuItems[0].section);
        }
    }
}

/// Reemplaza TODA la función handleNavigation con esto:

function handleNavigation(sectionId) {
    console.log("Navegando a sección:", sectionId);

    // 1. Cerrar modales si existen (limpieza)
    const chatbotModal = document.getElementById('chatbotModal');
    if (chatbotModal) chatbotModal.classList.add('hidden');

    // 2. Obtener usuario para saber qué script cargar
    const user = getUser();
    if (!user) return;
    const userRole = parseInt(user.rol);

    // === CASO A: ADMINISTRADOR (Cargar admin.js) ===
    if (sectionId === 'dashboard' || sectionId === 'alertas' || sectionId === 'usuarios') {
        if (typeof window.routeAdminSections === 'function') {
            routeAdminSections(sectionId);
        } else {
            console.log("Cargando módulo de Admin...");
            const script = document.createElement('script');
            script.src = 'frontend/js/admin.js'; // Ruta corregida
            script.onload = () => routeAdminSections(sectionId);
            script.onerror = () => console.error("Error cargando admin.js");
            document.body.appendChild(script);
        }
        return; 
    }

    // === CASO B: ESTUDIANTE / DOCENTE (Cargar student.js) ===
    // AQUÍ FALTABA TU LÓGICA
    if (userRole === 2 || userRole === 3) {
        if (typeof window.loadStudentSection === 'function') {
            // Si ya existe la función, la usamos
            window.loadStudentSection(sectionId);
        } else {
            // Si no existe, cargamos el archivo
            console.log("Cargando módulo de Estudiante...");
            const script = document.createElement('script');
            script.src = 'frontend/js/student.js'; // Ruta corregida
            script.onload = () => window.loadStudentSection(sectionId);
            script.onerror = () => console.error("Error cargando student.js. Verifica que el archivo exista en frontend/js/");
            document.body.appendChild(script);
        }
        return;
    }

    // === CASO C: GESTOR O FALLBACK (Usa funciones globales) ===
    if (typeof window.loadSection === 'function') {
        window.loadSection(sectionId);
    }
}

// === INTERACCIÓN UI (Sidebar, Dropdown) ===

// Abrir/Cerrar Sidebar
if (hamburger) {
  hamburger.addEventListener('click', () => {
    if (window.innerWidth < 992) {
      const isOpen = sidebar.classList.toggle('open');
      overlay.classList.toggle('hidden', !isOpen);
      hamburger.classList.toggle('active', isOpen);
      
      const leftGroup = document.querySelector('.left-group');
      if(leftGroup) leftGroup.classList.toggle('expanded', isOpen);
    }
  });
}

function closeSidebar() {
  if (window.innerWidth < 992) {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    if (hamburger) hamburger.classList.remove('active');
    const leftGroup = document.querySelector('.left-group');
    if(leftGroup) leftGroup.classList.remove('expanded');
  }
}

if (overlay) overlay.addEventListener('click', closeSidebar);

// Menú Usuario Dropdown
if (userDropdown) {
  userDropdown.addEventListener('click', (ev) => {
    ev.stopPropagation();
    userMenu.classList.toggle('show'); // Usamos clase CSS mejor que style inline
    userMenu.style.display = userMenu.style.display === 'flex' ? 'none' : 'flex';
  });
}

document.addEventListener('click', () => {
  if (userMenu) userMenu.style.display = 'none';
});

// === LOGOUT ===
logoutBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Llama a logout de auth.js que limpia la cookie en Python
      logout(); 
    });
  }
});

// === RESPONSIVE ===
window.addEventListener('resize', () => {
  if (window.innerWidth >= 992) {
    closeSidebar();
  }
});

// Arrancar la aplicación
init();