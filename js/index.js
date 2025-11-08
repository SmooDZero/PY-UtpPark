// === ELEMENTOS ===
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuItems = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.section');
const userDropdown = document.getElementById('userDropdown');
const userMenu = document.getElementById('userMenu');
const avatarImg = document.getElementById('avatarImg');
const userPanel = document.querySelector('.user-panel');
const leftGroup = document.querySelector('.left-group');

// === ABRIR / CERRAR SIDEBAR + ANIMACIÓN DE HAMBURGUESA (solo móvil) ===
hamburger.addEventListener('click', () => {
  if (window.innerWidth < 992) {
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden', !isOpen);
    hamburger.classList.toggle('active', isOpen);
    leftGroup.classList.toggle('expanded', isOpen);
  }
});

// === CERRAR CON OVERLAY ===
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.add('hidden');
  hamburger.classList.remove('active');
  leftGroup.classList.remove('expanded');
});

// === MENÚ ACTIVO Y CAMBIO DE SECCIÓN ===
menuItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    menuItems.forEach(mi => mi.classList.remove('active'));
    item.classList.add('active');

    const sectionId = item.dataset.section;
    loadSection(sectionId);

    // Cerrar sidebar si es móvil
    if (window.innerWidth < 992) {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
      hamburger.classList.remove('active');
      leftGroup.classList.remove('expanded');
    }
  });
});

function loadSection(id) {
  sections.forEach(s => {
    s.classList.toggle('active-section', s.id === id);
  });
}

// === SECCIÓN POR DEFECTO ===
loadSection('inicio');

// === MENÚ USUARIO (DESPLEGABLE) ===
let userMenuOpen = false;
if (userDropdown) {
  userDropdown.addEventListener('click', ev => {
    ev.stopPropagation();
    userMenuOpen = !userMenuOpen;
    userDropdown.classList.toggle('open', userMenuOpen);
    userMenu.style.display = userMenuOpen ? 'flex' : 'none';
  });
}

// Cerrar menú usuario al hacer clic fuera
document.addEventListener('click', () => {
  if (userMenuOpen) {
    userDropdown.classList.remove('open');
    userMenu.style.display = 'none';
    userMenuOpen = false;
  }
});

// === FALLBACK FOTO ===
if (avatarImg) {
  avatarImg.addEventListener('error', () => {
    avatarImg.src = 'img/default-user.png';
  });
}

// === ESCAPE PARA CERRAR TODO ===
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
    hamburger.classList.remove('active');
    leftGroup.classList.remove('expanded');

    if (userMenuOpen) {
      userDropdown.classList.remove('open');
      userMenu.style.display = 'none';
      userMenuOpen = false;
    }
  }
});

// === DESACTIVAR HAMBURGUESA EN ESCRITORIO ===
function updateHamburgerState() {
  const isDesktop = window.innerWidth >= 992;

  if (isDesktop) {
    hamburger.style.pointerEvents = 'none'; // no clickeable
    hamburger.classList.remove('active');
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
    leftGroup.classList.remove('expanded');
  } else {
    hamburger.style.pointerEvents = 'auto'; // clickeable en móvil
  }
}

// Detectar cambio de tamaño de ventana
window.addEventListener('resize', updateHamburgerState);

// Ejecutar al cargar
updateHamburgerState();



