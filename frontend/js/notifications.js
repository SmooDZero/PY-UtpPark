// frontend/js/notifications.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Iniciar el sondeo (Polling)
    startNotificationPolling();
    
    // 2. Configurar clic en la campana
    const icon = document.getElementById('notificationsIcon');
    if (icon) {
        icon.addEventListener('click', toggleNotificationsModal);
    }
    
    // 3. Configurar botón cerrar modal
    const closeBtn = document.getElementById('closeNotifications');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('notificationsModal').classList.add('hidden');
        });
    }
});

// --- LÓGICA DE SONDEO (POLLING) ---
function startNotificationPolling() {
    // Ejecutar inmediatamente
    checkNotifications();
    
    // Y luego cada 60 segundos
    setInterval(checkNotifications, 60000);
}

async function checkNotifications() {
    // Si no hay usuario (estamos en login), no hacemos nada
    if (window.location.pathname.includes('login')) return;

    try {
        // Usamos la función centralizada de auth.js
        const response = await authenticatedFetch('/notifications');
        if (!response || !response.ok) return;

        const data = await response.json();
        updateBadge(data.pendientes);
        
        // Si el modal está abierto, actualizamos la lista en tiempo real
        const modal = document.getElementById('notificationsModal');
        if (modal && !modal.classList.contains('hidden')) {
            renderList(data.lista);
        }
        
        // Guardamos la lista en memoria por si abren el modal luego
        window.cachedNotifications = data.lista;

    } catch (error) {
        console.error("Error polling notificaciones:", error);
    }
}

// --- ACTUALIZAR UI ---
function updateBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
        // Animación pequeña para llamar la atención
        badge.classList.add('pulse');
        setTimeout(() => badge.classList.remove('pulse'), 1000);
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (!modal) return;

    const isClosed = modal.classList.contains('hidden');
    
    if (isClosed) {
        modal.classList.remove('hidden');
        // Renderizar lo que tengamos en caché o pedir nuevo
        if (window.cachedNotifications) {
            renderList(window.cachedNotifications);
        }
        // Marcar como leídas en el servidor
        markAsRead();
    } else {
        modal.classList.add('hidden');
    }
}

function renderList(lista) {
    const container = document.getElementById('notificationsList'); // Asegúrate que este ID exista en tu index.html
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = '<p class="empty-notis">No tienes notificaciones nuevas.</p>';
        return;
    }

    container.innerHTML = lista.map(n => `
        <div class="notification-item ${n.leido ? 'read' : 'unread'} ${n.tipo_noti}">
            <div class="noti-icon">
                <i class="fas ${getIcon(n.tipo_noti)}"></i>
            </div>
            <div class="noti-content">
                <h4>${n.titulo_noti}</h4>
                <p>${n.mensaje_noti}</p>
            </div>
        </div>
    `).join('');
}

function getIcon(tipo) {
    if (tipo === 'warning') return 'fa-exclamation-circle';
    if (tipo === 'success') return 'fa-check-circle';
    return 'fa-info-circle';
}

async function markAsRead() {
    try {
        await authenticatedFetch('/notifications/read', { method: 'POST' });
        // Ocultar badge localmente
        updateBadge(0);
    } catch (e) {
        console.error("Error marcando leídas", e);
    }
}