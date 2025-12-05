// =========================================================
// ENRUTADOR DEL ADMINISTRADOR
// =========================================================
function routeAdminSections(section) {
    const content = document.getElementById('mainContent');
    // Loader simple
    content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    switch(section) {
        case 'dashboard': loadDashboardKPIs(); break;
        case 'alertas': loadAlertasMalUso(); break;
        case 'usuarios': loadGestionUsuarios(); break;
        default: loadDashboardKPIs(); 
    }
}

// =========================================================
// 1. DASHBOARD (Con lógica para RESERVADOS)
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
                <div class="info"><h3>Espacios Ocupados</h3><p id="kpi-ocupacion">...</p></div>
            </div>
            <div class="stat-card purple">
                <div class="icon-box purple"><i class="fas fa-chart-pie"></i></div>
                <div class="info"><h3>Tasa de Ocupación</h3><p id="kpi-tasa">...</p></div>
            </div>
            <div class="stat-card green">
                <div class="icon-box green"><i class="fas fa-check-circle"></i></div>
                <div class="info"><h3>Atenciones Hoy</h3><p id="kpi-volumen">...</p></div>
            </div>
        </div>
        <div class="charts-section">
            <div class="chart-card">
                <h3>Disponibilidad en Tiempo Real</h3>
                <div style="height: 300px; position: relative;"><canvas id="chartOcupacion"></canvas></div>
            </div>
        </div>
    `;

    try {
        const res = await authenticatedFetch('/admin/dashboard-stats');
        if (res && res.ok) {
            const stats = await res.json();
            
            const total = stats.capacidad_total || 1; 
            const libres = stats.espacios_libres;
            
            // AHORA USAMOS LOS 3 DATOS DEL BACKEND
            const ocupados = stats.espacios_ocupados; 
            const reservados = stats.espacios_reservados;

            // Calculamos ocupación real (Ocupado + Reservado bloquean el espacio)
            const noDisponibles = ocupados + reservados;
            const tasa = ((noDisponibles / total) * 100).toFixed(1);

            document.getElementById('kpi-ocupacion').textContent = `${noDisponibles} / ${total}`;
            document.getElementById('kpi-tasa').textContent = `${tasa}%`;
            document.getElementById('kpi-volumen').textContent = stats.autos_atendidos_hoy;

            // Pasamos los 3 valores al gráfico
            renderChartOcupacion(libres, ocupados, reservados);
        }
    } catch (e) { console.error(e); }
}

// =========================================================
// 2. ALERTAS
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
                <thead><tr><th>Usuario</th><th>DNI</th><th>Espacio</th><th>Hora</th><th>Estado</th></tr></thead>
                <tbody id="alerts-body"><tr><td colspan="5">Cargando...</td></tr></tbody>
            </table>
        </div>
    `;

    try {
        const res = await authenticatedFetch('/admin/alertas');
        if (res && res.ok) {
            const alertas = await res.json();
            const tbody = document.getElementById('alerts-body');
            if(alertas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:green">Sin alertas recientes.</td></tr>';
                return;
            }
            tbody.innerHTML = alertas.map(a => `
                <tr>
                    <td>${a.nombre}</td>
                    <td>${a.dni}</td>
                    <td><span class="badge warning">${a.codigo_visual || '-'}</span></td>
                    <td>${new Date(a.fecha_solicitud).toLocaleTimeString()}</td>
                    <td><span class="status-dot danger"></span> No Asistió</td>
                </tr>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

// =========================================================
// 3. GESTIÓN DE USUARIOS (CRUD + BUSCADOR SEGURO)
// =========================================================
async function loadGestionUsuarios() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="dashboard-header">
            <h2>Gestión de Usuarios</h2>
            <div class="header-actions">
                <input type="text" id="searchUser" placeholder="Buscar Placa, DNI o Nombre..." class="search-input">
                <button class="btn-primary" onclick="abrirModalCrear()"><i class="fas fa-plus"></i> Nuevo</button>
            </div>
        </div>

        <div class="tabs-container">
            <button class="tab-btn active" onclick="switchTab('con-vehiculo', this)"><i class="fas fa-car"></i> Con Vehículo</button>
            <button class="tab-btn" onclick="switchTab('sin-vehiculo', this)"><i class="fas fa-user"></i> Sin Vehículo / Staff</button>
        </div>

        <div id="tab-con-vehiculo" class="tab-content active-tab">
            <div class="table-container">
                <table class="admin-table">
                    <thead><tr><th>Nombre</th><th>DNI</th><th>Rol</th><th>Placa</th><th>Vehículo</th><th>Acción</th></tr></thead>
                    <tbody id="body-con-vehiculo"><tr><td colspan="6">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>

        <div id="tab-sin-vehiculo" class="tab-content" style="display:none">
            <div class="table-container">
                <table class="admin-table">
                    <thead><tr><th>Nombre</th><th>Rol</th><th>DNI</th><th>Email</th><th>Acción</th></tr></thead>
                    <tbody id="body-sin-vehiculo"><tr><td colspan="5">Cargando...</td></tr></tbody>
                </table>
            </div>
        </div>

        <div id="modalCrearUsuario" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header"><h2>Nuevo Usuario</h2><button class="modal-close" onclick="cerrarModalCrear()">&times;</button></div>
                <div class="modal-body">
                    <form id="formCrearUsuario" onsubmit="crearUsuario(event)">
                        <div class="form-group"><label>Nombre</label><input type="text" id="newNombre" required></div>
                        <div class="form-group"><label>DNI</label><input type="text" id="newDni" required maxlength="8"></div>
                        <div class="form-group"><label>Email</label><input type="email" id="newEmail" required></div>
                        <div class="form-group"><label>Contraseña</label><input type="password" id="newPass" required></div>
                        <div class="form-group"><label>Rol</label>
                            <select id="newRol">
                                <option value="2">Estudiante</option>
                                <option value="3">Docente</option>
                                <option value="4">Gestor</option>
                                <option value="1">Administrador</option>
                            </select>
                        </div>
                        <button type="submit" class="btn-primary" style="width:100%">Guardar</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    await cargarYRenderizarUsuarios();
}

async function cargarYRenderizarUsuarios() {
    try {
        const res = await authenticatedFetch('/admin/users');
        if (res && res.ok) {
            const todos = await res.json();
            window.todosLosUsuarios = todos; // Guardar global
            renderUsuariosTables(todos);

            // Buscador (Asignación directa para evitar errores de cloneNode)
            const input = document.getElementById('searchUser');
            input.onkeyup = (e) => {
                const term = e.target.value.toLowerCase();
                const filtrados = window.todosLosUsuarios.filter(u => {
                    const txtNombre = u.nombre ? u.nombre.toLowerCase() : '';
                    const txtDni = u.dni ? u.dni : '';
                    const txtPlaca = u.vehiculo ? u.vehiculo.placa.toLowerCase() : '';
                    return txtNombre.includes(term) || txtDni.includes(term) || txtPlaca.includes(term);
                });
                renderUsuariosTables(filtrados);
            };
        }
    } catch (e) { console.error("Error usuarios:", e); }
}

function renderUsuariosTables(lista) {
    const conAuto = lista.filter(u => u.vehiculo !== null);
    const sinAuto = lista.filter(u => u.vehiculo === null);

    // Tabla Con Vehículo
    const htmlCon = conAuto.map(u => `
        <tr>
            <td>${u.nombre}</td>
            <td><strong>${u.dni}</strong></td>
            <td><span class="badge ${u.rol_texto ? u.rol_texto.toLowerCase() : ''}">${u.rol_texto}</span></td>
            <td><span class="placa-badge">${u.vehiculo.placa}</span></td>
            <td>${u.vehiculo.descripcion}</td>
            <td><button class="btn-small btn-danger" onclick="eliminarUsuario(${u.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    document.getElementById('body-con-vehiculo').innerHTML = htmlCon || '<tr><td colspan="6">Sin datos</td></tr>';

    // Tabla Sin Vehículo
    const htmlSin = sinAuto.map(u => `
        <tr>
            <td>${u.nombre}</td>
            <td><span class="badge ${u.rol_texto ? u.rol_texto.toLowerCase() : ''}">${u.rol_texto}</span></td>
            <td>${u.dni}</td>
            <td>${u.email}</td>
            <td><button class="btn-small btn-danger" onclick="eliminarUsuario(${u.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    document.getElementById('body-sin-vehiculo').innerHTML = htmlSin || '<tr><td colspan="5">Sin datos</td></tr>';
}

// =========================================================
// UTILIDADES (CRUD, TABS, GRÁFICO)
// =========================================================
window.switchTab = function(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    if(btn) btn.classList.add('active');
};

window.abrirModalCrear = () => document.getElementById('modalCrearUsuario').classList.remove('hidden');
window.cerrarModalCrear = () => document.getElementById('modalCrearUsuario').classList.add('hidden');

window.crearUsuario = async (e) => {
    e.preventDefault();
    if(!confirm("¿Guardar usuario?")) return;
    
    const data = {
        nombre: document.getElementById('newNombre').value,
        dni: document.getElementById('newDni').value,
        email: document.getElementById('newEmail').value,
        password: document.getElementById('newPass').value,
        id_rol: document.getElementById('newRol').value
    };

    try {
        const res = await authenticatedFetch('/admin/users/create', { method: 'POST', body: JSON.stringify(data) });
        const r = await res.json();
        if(res.ok) { alert("Usuario creado"); cerrarModalCrear(); cargarYRenderizarUsuarios(); }
        else { alert("Error: " + r.error); }
    } catch(err) { console.error(err); alert("Error de conexión"); }
};

window.eliminarUsuario = async (id) => {
    if(!confirm("¿Eliminar usuario y todos sus datos?")) return;
    try {
        const res = await authenticatedFetch(`/admin/users/delete/${id}`, { method: 'DELETE' });
        if(res.ok) { alert("Eliminado"); cargarYRenderizarUsuarios(); }
        else { alert("Error al eliminar"); }
    } catch(e) { console.error(e); }
};

// =========================================================
// FUNCIÓN DEL GRÁFICO CORREGIDA (Al final del archivo)
// =========================================================
let chartInstance = null;

function renderChartOcupacion(libres, ocupados, reservados) {
    const ctx = document.getElementById('chartOcupacion');
    if(!ctx) return;
    
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            // AHORA SON 3 ETIQUETAS
            labels: ['Libre', 'Ocupado', 'Reservado'],
            datasets: [{
                data: [libres, ocupados, reservados],
                // COLORES: Verde, Rojo, Amarillo
                backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f'], 
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            return `${label}: ${value} espacios`;
                        }
                    }
                }
            }
        }
    });
}

// Exportar
window.routeAdminSections = routeAdminSections;