// Dashboard para usuarios (no gestores)
// Nota: getUser() se llama dentro de las funciones cuando se necesita

// Función global para cargar secciones (solo usuarios, no gestores)
if (typeof window.loadSection === 'undefined') {
  window.loadSection = async function(sectionId) {
    const user = getUser();
    if (!user) return;
    
    if (user.tipo === 'gestor') {
      // Si es gestor, no ejecutar este código (gestor.js manejará esto)
      return;
    }
    
    await loadSectionContent(sectionId);
  };
}

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
    case 'inicio':
      mainContent.innerHTML = await loadInicio();
      break;
    case 'disponibilidad':
      mainContent.innerHTML = await loadDisponibilidad();
      await loadEspaciosDisponibles();
      break;
    case 'vehiculo':
      mainContent.innerHTML = await loadVehiculo();
      await loadVehiculoData();
      break;
    case 'perfil':
      mainContent.innerHTML = await loadPerfil();
      await loadPerfilData();
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
      mainContent.innerHTML = await loadInicio();
  }
}

async function loadInicio() {
  const user = getUser();
  return `
    <section class="section active-section">
      <div class="dashboard-header">
        <h1>Bienvenido, ${user ? user.nombre : 'Usuario'}</h1>
        <p>Gestiona tu estacionamiento de forma sencilla</p>
      </div>
      <div class="dashboard-cards">
        <div class="card">
          <div class="card-icon" style="background: #5b35f2;">
            <i class="fas fa-parking"></i>
          </div>
          <div class="card-content">
            <h3>Espacios Disponibles</h3>
            <p class="card-value" id="espaciosDisponibles">-</p>
          </div>
        </div>
        <div class="card">
          <div class="card-icon" style="background: #fc4961;">
            <i class="fas fa-car"></i>
          </div>
          <div class="card-content">
            <h3>Mi Vehículo</h3>
            <p class="card-value" id="miVehiculo">-</p>
          </div>
        </div>
        <div class="card">
          <div class="card-icon" style="background: #4caf50;">
            <i class="fas fa-bell"></i>
          </div>
          <div class="card-content">
            <h3>Notificaciones</h3>
            <p class="card-value" id="notificacionesCount">0</p>
          </div>
        </div>
      </div>
      <div class="dashboard-content">
        <div class="info-box">
          <h3><i class="fas fa-info-circle"></i> Información Importante</h3>
          <ul>
            <li>El estacionamiento está disponible de lunes a viernes de 6:00 AM a 10:00 PM</li>
            <li>La velocidad máxima dentro del estacionamiento es de 10 km/h</li>
            <li>Estaciona únicamente en el espacio asignado por el gestor</li>
            <li>Mantén tu vehículo con la documentación al día</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

async function loadDisponibilidad() {
  return `
    <section class="section active-section">
      <div class="section-header">
        <h2><i class="fas fa-parking"></i> Disponibilidad de Espacios</h2>
        <button class="btn-refresh" onclick="loadEspaciosDisponibles()">
          <i class="fas fa-sync-alt"></i> Actualizar
        </button>
      </div>
      <div class="stats-container" id="statsContainer"></div>
      <div class="espacios-grid" id="espaciosGrid"></div>
    </section>
  `;
}

async function loadEspaciosDisponibles() {
  try {
    const response = await authenticatedFetch('/espacios/disponibilidad');
    if (!response) return;
    
    const data = await response.json();
    
    // Mostrar estadísticas
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <h3>Total</h3>
          <p class="stat-value">${data.estadisticas.total}</p>
        </div>
        <div class="stat-card available">
          <h3>Disponibles</h3>
          <p class="stat-value">${data.estadisticas.disponibles}</p>
        </div>
        <div class="stat-card occupied">
          <h3>Ocupados</h3>
          <p class="stat-value">${data.estadisticas.ocupados}</p>
        </div>
      `;
    }

    // Mostrar espacios por tipo
    const espaciosGrid = document.getElementById('espaciosGrid');
    if (espaciosGrid) {
      let html = '';
      for (const [tipo, stats] of Object.entries(data.estadisticas.porTipo)) {
        html += `
          <div class="tipo-section">
            <h3>Tipo: ${tipo.toUpperCase()}</h3>
            <div class="espacios-list">
              ${data.espacios
                .filter(e => e.tipo === tipo)
                .map(espacio => `
                  <div class="espacio-item ${espacio.estado}">
                    <span class="espacio-numero">${espacio.numero}</span>
                    <span class="espacio-estado">${espacio.estado}</span>
                    <span class="espacio-ubicacion">${espacio.ubicacion || '-'}</span>
                  </div>
                `).join('')}
            </div>
          </div>
        `;
      }
      espaciosGrid.innerHTML = html;
    }
  } catch (error) {
    console.error('Error al cargar espacios:', error);
  }
}

async function loadVehiculo() {
  return `
    <section class="section active-section">
      <div class="section-header">
        <h2><i class="fas fa-car"></i> Mi Vehículo</h2>
      </div>
      <div id="vehiculoContent"></div>
    </section>
  `;
}

async function loadVehiculoData() {
  const content = document.getElementById('vehiculoContent');
  
  try {
    const response = await authenticatedFetch('/users/profile');
    if (!response) return;
    
    const profile = await response.json();
    
    if (profile.vehiculo_id) {
      content.innerHTML = `
        <div class="vehiculo-card">
          <h3>Vehículo Registrado</h3>
          <div class="vehiculo-info">
            <p><strong>Placa:</strong> ${profile.placa}</p>
            <p><strong>Marca:</strong> ${profile.marca}</p>
            <p><strong>Modelo:</strong> ${profile.modelo}</p>
            <p><strong>Color:</strong> ${profile.color}</p>
            <p><strong>Tipo:</strong> ${profile.vehiculo_tipo}</p>
          </div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="vehiculo-form">
          <h3>Registrar Vehículo</h3>
          <p>Para usar el estacionamiento, necesitas registrar tu vehículo.</p>
          <form id="vehiculoForm">
            <div class="form-group">
              <label>Placa *</label>
              <input type="text" id="placa" required>
            </div>
            <div class="form-group">
              <label>Marca *</label>
              <input type="text" id="marca" required>
            </div>
            <div class="form-group">
              <label>Modelo *</label>
              <input type="text" id="modelo" required>
            </div>
            <div class="form-group">
              <label>Color *</label>
              <input type="text" id="color" required>
            </div>
            <div class="form-group">
              <label>Tipo *</label>
              <select id="tipo" required>
                <option value="">Seleccione...</option>
                <option value="auto">Auto</option>
                <option value="moto">Moto</option>
                <option value="camioneta">Camioneta</option>
              </select>
            </div>
            <button type="submit" class="btn-primary">Registrar Vehículo</button>
          </form>
        </div>
      `;

      document.getElementById('vehiculoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await registrarVehiculo();
      });
    }
  } catch (error) {
    console.error('Error al cargar vehículo:', error);
  }
}

async function registrarVehiculo() {
  const placa = document.getElementById('placa').value;
  const marca = document.getElementById('marca').value;
  const modelo = document.getElementById('modelo').value;
  const color = document.getElementById('color').value;
  const tipo = document.getElementById('tipo').value;

  try {
    const response = await authenticatedFetch('/users/vehiculo', {
      method: 'POST',
      body: JSON.stringify({ placa, marca, modelo, color, tipo })
    });

    if (!response) return;

    if (response.ok) {
      alert('Vehículo registrado correctamente');
      loadVehiculoData();
    } else {
      const data = await response.json();
      alert(data.error || 'Error al registrar vehículo');
    }
  } catch (error) {
    alert('Error al registrar vehículo');
  }
}

async function loadPerfil() {
  return `
    <section class="section active-section">
      <div class="section-header">
        <h2><i class="fas fa-user"></i> Mi Perfil</h2>
      </div>
      <div id="perfilContent"></div>
    </section>
  `;
}

async function loadPerfilData() {
  const content = document.getElementById('perfilContent');
  
  try {
    const response = await authenticatedFetch('/users/profile');
    if (!response) return;
    
    const profile = await response.json();
    
    content.innerHTML = `
      <div class="profile-card">
        <div class="profile-header">
          <img src="img/default-user.png" alt="Usuario" class="profile-avatar">
          <h3>${profile.nombre}</h3>
        </div>
        <div class="profile-info">
          <p><strong>Código:</strong> ${profile.codigo}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Tipo:</strong> ${profile.tipo}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error al cargar perfil:', error);
  }
}

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

