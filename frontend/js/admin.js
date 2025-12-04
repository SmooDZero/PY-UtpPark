// =========================================================
// ENRUTADOR DEL ADMINISTRADOR (Controla el menú lateral)
// =========================================================

// Esta función es llamada por index.js cuando haces clic en el menú
function routeAdminSections(section) {
    // Limpiar contenido previo
    const content = document.getElementById('mainContent');
    content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    // Decidir qué pantalla mostrar
    switch(section) {
        case 'dashboard': 
            loadDashboardKPIs(); 
            break;
        case 'alertas': 
            loadAlertasMalUso(); 
            break;
        case 'usuarios': 
            loadGestionUsuarios(); 
            break;
        default:
            loadDashboardKPIs(); // Por defecto
    }
}

// =========================================================
// 1. VISTA: KPIs DE OPERACIÓN Y USO (El Termómetro)
// =========================================================
async function loadDashboardKPIs() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="dashboard-header">
            <h2>KPIs de Operación y Uso</h2>
            <p class="subtitle">Métricas de eficiencia del estacionamiento universitario</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="icon-box blue"><i class="fas fa-car"></i></div>
                <div class="info">
                    <h3>Autos en Campus</h3>
                    <p id="kpi-ocupacion">...</p>
                </div>
            </div>
            <div class="stat-card purple">
                <div class="icon-box purple"><i class="fas fa-chart-pie"></i></div>
                <div class="info">
                    <h3>Tasa de Ocupación</h3>
                    <p id="kpi-tasa">...</p>
                </div>
            </div>
            <div class="stat-card green">
                <div class="icon-box green"><i class="fas fa-check-circle"></i></div>
                <div class="info">
                    <h3>Atenciones Hoy</h3>
                    <p id="kpi-volumen">...</p>
                </div>
            </div>
        </div>

        <div class="charts-section">
            <div class="chart-card">
                <h3>Disponibilidad en Tiempo Real</h3>
                <div style="height: 300px; position: relative;">
                    <canvas id="chartOcupacion"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Cargar datos reales de Python
 try {
        const res = await authenticatedFetch('/admin/dashboard-stats');
        if (res && res.ok) {
            const stats = await res.json();

            const total = stats.capacidad_total || 1;
            const libres = stats.espacios_libres;
            const ocupados = stats.espacios_ocupados;
            const reservados = stats.espacios_reservados; // Dato nuevo

            // KPI de Texto (Ocupación Real = Ocupados + Reservados)
            const ocupacionReal = ocupados + reservados;
            const tasa = ((ocupacionReal / total) * 100).toFixed(1);

            // Pintar números en las tarjetas
            document.getElementById('kpi-ocupacion').textContent = `${ocupacionReal} / ${total}`;
            document.getElementById('kpi-tasa').textContent = `${tasa}%`;
            document.getElementById('kpi-volumen').textContent = stats.autos_atendidos_hoy;

            // Pintar gráfico con los 3 datos
            renderChartOcupacion(libres, ocupados, reservados);
        }
    } catch (e) {
        console.error("Error cargando KPIs:", e);
    }
}

// =========================================================
// 2. VISTA: ALERTAS DE "MAL USO" (Los que no llegaron)
// =========================================================
async function loadAlertasMalUso() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="dashboard-header">
            <h2>Alertas de "Mal Uso"</h2>
            <p class="subtitle">Usuarios que reservaron (15 min) y no ingresaron.</p>
        </div>
        
        <div class="table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>DNI</th>
                        <th>Espacio Bloqueado</th>
                        <th>Hora Solicitud</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody id="alerts-body">
                    <tr><td colspan="5" class="loading-text">Buscando infracciones...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    try {
        const res = await authenticatedFetch('/admin/alertas');
        if (res && res.ok) {
            const alertas = await res.json();
            const tbody = document.getElementById('alerts-body');
            
            if(alertas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color: green;"><i class="fas fa-check"></i> No hay alertas recientes.</td></tr>';
                return;
            }

            tbody.innerHTML = alertas.map(a => `
                <tr>
                    <td>${a.nombre}</td>
                    <td>${a.dni}</td>
                    <td><span class="badge warning">${a.codigo_visual}</span></td>
                    <td>${new Date(a.fecha_solicitud).toLocaleTimeString()}</td>
                    <td><span class="status-dot danger"></span> No Asistió</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error("Error cargando alertas:", e);
    }
}

// =========================================================
// 3. VISTA: GESTIÓN DE USUARIOS (Con Pestañas)
// =========================================================
async function loadGestionUsuarios() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="dashboard-header">
            <h2>Gestión de Usuarios</h2>
            <div class="header-actions">
                <input type="text" id="searchUser" placeholder="Buscar..." class="search-input">
            </div>
        </div>

        <div class="tabs-container">
            <button class="tab-btn active" onclick="switchTab('con-vehiculo', this)">
                <i class="fas fa-car"></i> Con Vehículo
            </button>
            <button class="tab-btn" onclick="switchTab('sin-vehiculo', this)">
                <i class="fas fa-user"></i> Sin Vehículo / Staff
            </button>
        </div>

        <div id="tab-con-vehiculo" class="tab-content active-tab">
            <div class="table-container">
                <table class="admin-table">
                    <thead><tr><th>Nombre</th><th>Rol</th><th>Placa</th><th>Vehículo</th></tr></thead>
                    <tbody id="body-con-vehiculo"><tr><td colspan="4">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>

        <div id="tab-sin-vehiculo" class="tab-content" style="display:none">
            <div class="table-container">
                <table class="admin-table">
                    <thead><tr><th>Nombre</th><th>Rol</th><th>DNI</th><th>Email</th></tr></thead>
                    <tbody id="body-sin-vehiculo"><tr><td colspan="4">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>
    `;

    // Cargar datos
    const res = await authenticatedFetch('/admin/users');
    if (res && res.ok) {
        const todos = await res.json();
        renderUsuariosTables(todos);

        // Buscador
        document.getElementById('searchUser').addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = todos.filter(u => u.nombre.toLowerCase().includes(term) || u.dni.includes(term));
            renderUsuariosTables(filtrados);
        });
    }
}

// Renderizador auxiliar de tablas
function renderUsuariosTables(lista) {
    const conAuto = lista.filter(u => u.vehiculo !== null);
    const sinAuto = lista.filter(u => u.vehiculo === null);

    document.getElementById('body-con-vehiculo').innerHTML = conAuto.map(u => `
        <tr>
            <td>${u.nombre}</td>
            <td><span class="badge ${u.rol_texto.toLowerCase()}">${u.rol_texto}</span></td>
            <td><span class="placa-badge">${u.vehiculo.placa}</span></td>
            <td>${u.vehiculo.descripcion}</td>
        </tr>
    `).join('') || '<tr><td colspan="4">Sin datos</td></tr>';

    document.getElementById('body-sin-vehiculo').innerHTML = sinAuto.map(u => `
        <tr>
            <td>${u.nombre}</td>
            <td><span class="badge ${u.rol_texto.toLowerCase()}">${u.rol_texto}</span></td>
            <td>${u.dni}</td>
            <td>${u.email}</td>
        </tr>
    `).join('') || '<tr><td colspan="4">Sin datos</td></tr>';
}

// =========================================================
// UTILIDADES GLOBALES
// =========================================================

// En frontend/js/admin.js -> renderChartOcupacion
// 2. FUNCIÓN DEL GRÁFICO (AHORA CON 3 COLORES)
let chartInstance = null;

function renderChartOcupacion(libres, ocupados, reservados) {
    const canvas = document.getElementById('chartOcupacion');
    if (!canvas) return; // Protección por si no existe el elemento

    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico previo si existe para evitar superposición
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Libre', 'Ocupado', 'Reservado'], // <--- 3 Etiquetas
            datasets: [{
                data: [libres, ocupados, reservados], // <--- 3 Datos
                backgroundColor: [
                    '#2ecc71', // Verde
                    '#e74c3c', // Rojo
                    '#fbc02d'  // Amarillo (Nuevo)
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                }
            }
        }
    });
}

// Exportar función principal
window.routeAdminSections = routeAdminSections;
// Fallback por si index.js llama a loadAdminDashboard directamente
window.loadAdminDashboard = () => routeAdminSections('dashboard');
