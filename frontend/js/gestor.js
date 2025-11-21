// Dashboard para gestores
// Nota: getUser() se llama dentro de las funciones cuando se necesita

// Función global para cargar secciones (gestor)
// Sobrescribe la función si ya existe para manejar gestores
const originalLoadSection = window.loadSection;
window.loadSection = async function(sectionId) {
  const user = getUser();
  if (!user) return;
  
  if (user.tipo === 'gestor') {
    // Si es gestor, usar la función de gestor
    await loadSectionContent(sectionId);
  } else if (originalLoadSection) {
    // Si no es gestor, usar la función original (de dashboard.js)
    await originalLoadSection(sectionId);
  }
};

// Cargar sección según hash de URL
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  if (hash && typeof window.loadSection === 'function') {
    window.loadSection(hash);
  }
});

// Cargar sección inicial desde hash
if (window.location.hash) {
  const hash = window.location.hash.substring(1);
  if (typeof window.loadSection === 'function') {
    window.loadSection(hash);
  }
}

async function loadSectionContent(sectionId) {
  const mainContent = document.getElementById('mainContent');
  
  switch(sectionId) {
    case 'dashboard':
      mainContent.innerHTML = await loadDashboardGestor();
      await loadDashboardData();
      break;
    case 'espacios':
      mainContent.innerHTML = await loadEspaciosGestor();
      await loadEspaciosData();
      break;
    case 'usuarios':
      mainContent.innerHTML = await loadUsuariosGestor();
      await loadUsuariosData();
      break;
    case 'estadisticas':
      mainContent.innerHTML = await loadEstadisticas();
      await loadEstadisticasData();
      break;
    case 'chatbot':
      // Mostrar contenido del chatbot en lugar de abrir modal automáticamente
      mainContent.innerHTML = `
        <section class="section active-section">
          <div class="section-header">
            <h2><i class="fas fa-robot"></i> Asistente Virtual</h2>
            <button class="btn-primary" id="openChatbotBtn" data-action="open-chatbot">
              <i class="fas fa-comments"></i> Abrir Chatbot
            </button>
          </div>
          <div class="info-box">
            <h3>¿Necesitas ayuda?</h3>
            <p>Haz clic en el botón "Abrir Chatbot" para iniciar una conversación con nuestro asistente virtual.</p>
            <p>El chatbot puede ayudarte con:</p>
            <ul>
              <li>Reglas del estacionamiento</li>
              <li>Horarios y disponibilidad</li>
              <li>Normas de tránsito</li>
              <li>Requisitos y documentación</li>
            </ul>
          </div>
        </section>
      `;
      // Agregar event listener después de que el HTML se inserte
      setTimeout(() => {
        const openBtn = document.getElementById('openChatbotBtn');
        if (openBtn) {
          openBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = document.getElementById('chatbotModal');
            if (modal) {
              modal.classList.remove('hidden');
              const input = document.getElementById('chatbotInput');
              if (input) {
                setTimeout(() => input.focus(), 100);
              }
              if (typeof loadChatbotHistory === 'function') {
                loadChatbotHistory();
              }
            } else {
              console.error('Modal del chatbot no encontrado');
            }
          };
        } else {
          console.error('Botón de abrir chatbot no encontrado');
        }
      }, 50);
      break;
    default:
      mainContent.innerHTML = await loadDashboardGestor();
      await loadDashboardData();
  }
}

async function loadDashboardGestor() {
  return `
    <section class="section active-section">
      <div class="dashboard-header">
        <h1>Panel de Gestión</h1>
        <p>Gestiona espacios y usuarios del estacionamiento</p>
      </div>
      <div class="dashboard-cards" id="dashboardCards"></div>
      <div class="dashboard-content">
        <div class="recent-activity">
          <h3>Actividad Reciente</h3>
          <div id="recentActivity"></div>
        </div>
      </div>
    </section>
  `;
}

async function loadDashboardData() {
  try {
    const response = await authenticatedFetch('/parking/espacios');
    if (!response) return;
    
    const espacios = await response.json();
    
    const total = espacios.length;
    const disponibles = espacios.filter(e => e.estado === 'disponible').length;
    const ocupados = espacios.filter(e => e.estado === 'ocupado').length;
    
    const cards = document.getElementById('dashboardCards');
    if (cards) {
      cards.innerHTML = `
        <div class="card">
          <div class="card-icon" style="background: #5b35f2;">
            <i class="fas fa-parking"></i>
          </div>
          <div class="card-content">
            <h3>Total Espacios</h3>
            <p class="card-value">${total}</p>
          </div>
        </div>
        <div class="card">
          <div class="card-icon" style="background: #4caf50;">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-content">
            <h3>Disponibles</h3>
            <p class="card-value">${disponibles}</p>
          </div>
        </div>
        <div class="card">
          <div class="card-icon" style="background: #fc4961;">
            <i class="fas fa-times-circle"></i>
          </div>
          <div class="card-content">
            <h3>Ocupados</h3>
            <p class="card-value">${ocupados}</p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
  }
}

async function loadEspaciosGestor() {
  return `
    <section class="section active-section">
      <div class="section-header">
        <h2><i class="fas fa-parking"></i> Gestión de Espacios</h2>
        <button class="btn-primary" onclick="showCrearEspacio()">
          <i class="fas fa-plus"></i> Crear Espacio
        </button>
      </div>
      <div class="espacios-gestor-grid" id="espaciosGrid"></div>
    </section>
  `;
}

async function loadEspaciosData() {
  try {
    const response = await authenticatedFetch('/parking/espacios');
    if (!response) return;
    
    const espacios = await response.json();
    
    const grid = document.getElementById('espaciosGrid');
    if (grid) {
      grid.innerHTML = espacios.map(espacio => `
        <div class="espacio-gestor-card ${espacio.estado}">
          <div class="espacio-header">
            <h3>${espacio.numero}</h3>
            <span class="badge ${espacio.estado}">${espacio.estado}</span>
          </div>
          <div class="espacio-info">
            <p><strong>Tipo:</strong> ${espacio.tipo}</p>
            <p><strong>Ubicación:</strong> ${espacio.ubicacion || '-'}</p>
            ${espacio.usuario_nombre ? `
              <p><strong>Asignado a:</strong> ${espacio.usuario_nombre} (${espacio.usuario_codigo})</p>
              <p><strong>Vehículo:</strong> ${espacio.placa}</p>
            ` : '<p>Sin asignar</p>'}
          </div>
          <div class="espacio-actions">
            ${espacio.estado === 'ocupado' ? `
              <button class="btn-small btn-success" onclick="liberarEspacio(${espacio.id})">
                <i class="fas fa-unlock"></i> Liberar
              </button>
            ` : `
              <button class="btn-small btn-primary" onclick="asignarEspacio(${espacio.id})">
                <i class="fas fa-user-plus"></i> Asignar
              </button>
            `}
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error al cargar espacios:', error);
  }
}

async function loadUsuariosGestor() {
  return `
    <section class="section active-section">
      <div class="section-header">
        <h2><i class="fas fa-users"></i> Usuarios con Vehículos</h2>
      </div>
      <div class="usuarios-table-container">
        <table class="usuarios-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Placa</th>
              <th>Vehículo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="usuariosTableBody"></tbody>
        </table>
      </div>
    </section>
  `;
}

async function loadUsuariosData() {
  try {
    const response = await authenticatedFetch('/parking/usuarios');
    if (!response) return;
    
    const usuarios = await response.json();
    
    const tbody = document.getElementById('usuariosTableBody');
    if (tbody) {
      tbody.innerHTML = usuarios.map(usuario => `
        <tr>
          <td>${usuario.codigo}</td>
          <td>${usuario.nombre}</td>
          <td><span class="badge">${usuario.tipo}</span></td>
          <td>${usuario.placa}</td>
          <td>${usuario.marca} ${usuario.modelo}</td>
          <td>
            <button class="btn-small btn-primary" onclick="asignarEspacioUsuario(${usuario.id}, ${usuario.vehiculo_id})">
              Asignar Espacio
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}

async function loadEstadisticas() {
  return `
    <section class="section active-section">
      <div class="section-header">
        <h2><i class="fas fa-chart-bar"></i> Estadísticas</h2>
      </div>
      <div id="estadisticasContent"></div>
    </section>
  `;
}

async function loadEstadisticasData() {
  try {
    const response = await authenticatedFetch('/parking/espacios');
    if (!response) return;
    
    const espacios = await response.json();
    
    const stats = {
      total: espacios.length,
      disponibles: espacios.filter(e => e.estado === 'disponible').length,
      ocupados: espacios.filter(e => e.estado === 'ocupado').length,
      porTipo: {}
    };

    espacios.forEach(espacio => {
      if (!stats.porTipo[espacio.tipo]) {
        stats.porTipo[espacio.tipo] = { total: 0, disponibles: 0, ocupados: 0 };
      }
      stats.porTipo[espacio.tipo].total++;
      if (espacio.estado === 'disponible') stats.porTipo[espacio.tipo].disponibles++;
      if (espacio.estado === 'ocupado') stats.porTipo[espacio.tipo].ocupados++;
    });

    const content = document.getElementById('estadisticasContent');
    if (content) {
      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total de Espacios</h3>
            <p class="stat-value">${stats.total}</p>
          </div>
          <div class="stat-card available">
            <h3>Disponibles</h3>
            <p class="stat-value">${stats.disponibles}</p>
          </div>
          <div class="stat-card occupied">
            <h3>Ocupados</h3>
            <p class="stat-value">${stats.ocupados}</p>
          </div>
        </div>
        <div class="stats-by-type">
          <h3>Por Tipo de Vehículo</h3>
          ${Object.entries(stats.porTipo).map(([tipo, data]) => `
            <div class="type-stat">
              <h4>${tipo.toUpperCase()}</h4>
              <p>Total: ${data.total} | Disponibles: ${data.disponibles} | Ocupados: ${data.ocupados}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

// Funciones globales para asignar/liberar espacios
window.asignarEspacio = async function(espacioId) {
  // Cargar usuarios primero
  const response = await authenticatedFetch('/parking/usuarios');
  if (!response) return;
  
  const usuarios = await response.json();
  
  if (usuarios.length === 0) {
    alert('No hay usuarios con vehículos registrados');
    return;
  }

  const usuarioOptions = usuarios.map(u => 
    `<option value="${u.id}" data-vehiculo="${u.vehiculo_id}">${u.nombre} (${u.codigo}) - ${u.placa}</option>`
  ).join('');

  const usuarioId = prompt(`Seleccione usuario:\n${usuarios.map((u, i) => `${i+1}. ${u.nombre} (${u.codigo})`).join('\n')}\n\nIngrese el número:`, '1');
  
  if (!usuarioId) return;
  
  const selectedUser = usuarios[parseInt(usuarioId) - 1];
  if (!selectedUser) {
    alert('Usuario inválido');
    return;
  }

  try {
    const assignResponse = await authenticatedFetch('/parking/asignar', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: selectedUser.id,
        vehiculo_id: selectedUser.vehiculo_id,
        espacio_id: espacioId
      })
    });

    if (!assignResponse) return;

    if (assignResponse.ok) {
      alert('Espacio asignado correctamente');
      loadEspaciosData();
    } else {
      const data = await assignResponse.json();
      alert(data.error || 'Error al asignar espacio');
    }
  } catch (error) {
    alert('Error al asignar espacio');
  }
};

window.liberarEspacio = async function(espacioId) {
  if (!confirm('¿Está seguro de liberar este espacio?')) return;

  try {
    const response = await authenticatedFetch(`/parking/liberar/${espacioId}`, {
      method: 'POST'
    });

    if (!response) return;

    if (response.ok) {
      alert('Espacio liberado correctamente');
      loadEspaciosData();
    } else {
      const data = await response.json();
      alert(data.error || 'Error al liberar espacio');
    }
  } catch (error) {
    alert('Error al liberar espacio');
  }
};

window.asignarEspacioUsuario = async function(usuarioId, vehiculoId) {
  const response = await authenticatedFetch('/parking/espacios');
  if (!response) return;
  
  const espacios = await response.json();
  const disponibles = espacios.filter(e => e.estado === 'disponible');
  
  if (disponibles.length === 0) {
    alert('No hay espacios disponibles');
    return;
  }

  const espacioOptions = disponibles.map((e, i) => 
    `${i+1}. ${e.numero} (${e.tipo}) - ${e.ubicacion || 'Sin ubicación'}`
  ).join('\n');

  const espacioIndex = prompt(`Espacios disponibles:\n${espacioOptions}\n\nIngrese el número:`, '1');
  
  if (!espacioIndex) return;
  
  const selectedEspacio = disponibles[parseInt(espacioIndex) - 1];
  if (!selectedEspacio) {
    alert('Espacio inválido');
    return;
  }

  try {
    const assignResponse = await authenticatedFetch('/parking/asignar', {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: usuarioId,
        vehiculo_id: vehiculoId,
        espacio_id: selectedEspacio.id
      })
    });

    if (!assignResponse) return;

    if (assignResponse.ok) {
      alert('Espacio asignado correctamente');
      loadUsuariosData();
      loadEspaciosData();
    } else {
      const data = await assignResponse.json();
      alert(data.error || 'Error al asignar espacio');
    }
  } catch (error) {
    alert('Error al asignar espacio');
  }
};

window.showCrearEspacio = function() {
  const numero = prompt('Número del espacio (ej: A-006):');
  if (!numero) return;

  const tipo = prompt('Tipo (auto/moto/camioneta/discapacitado):');
  if (!tipo) return;

  const ubicacion = prompt('Ubicación (opcional):') || null;

  if (!['auto', 'moto', 'camioneta', 'discapacitado'].includes(tipo)) {
    alert('Tipo inválido');
    return;
  }

  authenticatedFetch('/parking/espacios', {
    method: 'POST',
    body: JSON.stringify({ numero, tipo, ubicacion })
  }).then(response => {
    if (!response) return;
    if (response.ok) {
      alert('Espacio creado correctamente');
      loadEspaciosData();
    } else {
      response.json().then(data => alert(data.error || 'Error al crear espacio'));
    }
  });
};

// La función openChatbot está definida globalmente en chatbot.js

// Importar funciones necesarias
function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

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

