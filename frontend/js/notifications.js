// Sistema de notificaciones
const notificationsIcon = document.getElementById('notificationsIcon');
const notificationBadge = document.getElementById('notificationBadge');
const notificationsModal = document.getElementById('notificationsModal');
const notificationsList = document.getElementById('notificationsList');
const closeNotifications = document.getElementById('closeNotifications');

// Cargar notificaciones al iniciar
loadNotifications();
checkUnreadNotifications();

// Verificar notificaciones no leídas cada 30 segundos
setInterval(() => {
  checkUnreadNotifications();
}, 30000);

// Abrir modal de notificaciones
if (notificationsIcon) {
  notificationsIcon.addEventListener('click', () => {
    notificationsModal.classList.remove('hidden');
    loadNotifications();
  });
}

// Cerrar modal
if (closeNotifications) {
  closeNotifications.addEventListener('click', () => {
    notificationsModal.classList.add('hidden');
  });
}

async function loadNotifications() {
  try {
    const response = await authenticatedFetch('/notifications');
    if (!response) return;

    const notificaciones = await response.json();

    if (notificaciones.length === 0) {
      notificationsList.innerHTML = '<p class="no-notifications">No hay notificaciones</p>';
      return;
    }

    notificationsList.innerHTML = notificaciones.map(notif => `
      <div class="notification-item ${notif.leida ? 'read' : 'unread'}" data-id="${notif.id}">
        <div class="notification-icon">
          ${getNotificationIcon(notif.tipo)}
        </div>
        <div class="notification-content">
          <h4>${notif.titulo}</h4>
          <p>${notif.mensaje}</p>
          <span class="notification-time">${formatDate(notif.created_at)}</span>
        </div>
        ${!notif.leida ? '<button class="mark-read" onclick="markAsRead(' + notif.id + ')"><i class="fas fa-check"></i></button>' : ''}
      </div>
    `).join('');

    // Agregar event listeners para marcar como leída
    document.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (!item.classList.contains('read')) {
          markAsRead(id);
        }
      });
    });

  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

async function checkUnreadNotifications() {
  try {
    const response = await authenticatedFetch('/notifications/no-leidas');
    if (!response) return;

    const data = await response.json();
    
    if (data.count > 0) {
      notificationBadge.textContent = data.count > 99 ? '99+' : data.count;
      notificationBadge.style.display = 'block';
    } else {
      notificationBadge.style.display = 'none';
    }
  } catch (error) {
    console.error('Error al verificar notificaciones:', error);
  }
}

async function markAsRead(id) {
  try {
    const response = await authenticatedFetch(`/notifications/${id}/leida`, {
      method: 'PUT'
    });

    if (!response) return;

    if (response.ok) {
      const item = document.querySelector(`[data-id="${id}"]`);
      if (item) {
        item.classList.add('read');
        item.classList.remove('unread');
        const markReadBtn = item.querySelector('.mark-read');
        if (markReadBtn) markReadBtn.remove();
      }
      checkUnreadNotifications();
    }
  } catch (error) {
    console.error('Error al marcar como leída:', error);
  }
}

function getNotificationIcon(tipo) {
  switch(tipo) {
    case 'disponibilidad':
      return '<i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i>';
    case 'norma':
      return '<i class="fas fa-info-circle" style="color: #2196F3;"></i>';
    case 'recordatorio':
      return '<i class="fas fa-bell" style="color: #9c27b0;"></i>';
    default:
      return '<i class="fas fa-bell"></i>';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('es-ES');
}

// Hacer función global
window.markAsRead = markAsRead;

// Importar funciones necesarias
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(`/api${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return null;
  }

  return response;
}

