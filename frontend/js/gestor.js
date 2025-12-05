// frontend/js/gestor.js - VERSIÓN AUTOMÁTICA & FLUIDA

// === VARIABLES GLOBALES ===
let usuarioSeleccionado = null;
let timerBusqueda = null; // Para el auto-search

// 1. ROUTER PRINCIPAL
const originalLoadSection = window.loadSection;
window.loadSection = async function(sectionId) {
    const user = getUser();
    // ID Rol 4 = Gestor
    if (user && parseInt(user.rol) === 4) {
        if (sectionId === 'espacios' || sectionId === 'dashboard' || sectionId === 'inicio') {
            await loadGestorView();
        } else if (sectionId === 'usuarios') {
            // Cargar admin.js si es necesario
            if (typeof window.routeAdminSections === 'function') window.routeAdminSections('usuarios');
            else loadScript('frontend/js/admin.js', () => window.routeAdminSections('usuarios'));
        }
    } else {
        if (typeof originalLoadSection === 'function') originalLoadSection(sectionId);
    }
};

// 2. VISTA PRINCIPAL (LA CASETA)
async function loadGestorView() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="gestor-container">
            <div class="control-panel">
                <div class="kpi-box">
                    <div class="kpi-item available">
                        <span class="kpi-number" id="lbl-libres">--</span>
                        <span class="kpi-label">LIBRES</span>
                    </div>
                    <div class="kpi-item occupied">
                        <span class="kpi-number" id="lbl-ocupados">--</span>
                        <span class="kpi-label">OCUPADOS</span>
                    </div>
                    <div class="kpi-item reserved">
                        <span class="kpi-number" id="lbl-reservados">--</span>
                        <span class="kpi-label">RESERVADOS</span>
                    </div>
                </div>

                <div class="scanner-box">
                    <h3><i class="fas fa-barcode"></i> Control de Acceso</h3>
                    <p>Digita DNI o Placa (Búsqueda Auto):</p>
                    <div class="input-group-lg">
                        <input type="text" id="inputIngreso" placeholder="Ej: 7022..." autocomplete="off" autofocus>
                        <button id="btnValidar" class="btn-scan"><i class="fas fa-search"></i></button>
                    </div>
                    
                    <div id="cardUsuario" class="user-found-card hidden">
                        <div class="found-header">
                            <span class="badge-role" id="foundRol">USUARIO</span>
                            <button class="btn-close-found" onclick="limpiarSeleccion()">&times;</button>
                        </div>
                        <h4 id="foundNombre">Nombre...</h4>
                        <p id="foundPlaca"><i class="fas fa-car"></i> ...</p>
                        <div id="foundStatus" class="found-status">...</div>
                    </div>
                </div>

                <div class="actions-log">
                    <h4>Actividad Reciente</h4>
                    <ul id="listaMovimientos" class="log-list"></ul>
                </div>
            </div>

            <div class="map-panel">
                <div class="map-header">
                    <h2><i class="fas fa-map-marked-alt"></i> Mapa del Estacionamiento</h2>
                    <button class="btn-refresh" onclick="refreshMap()"><i class="fas fa-sync-alt"></i></button>
                </div>
                <div class="map-legend">
                    <span class="legend-item"><span class="dot free"></span> Libre</span>
                    <span class="legend-item"><span class="dot busy"></span> Ocupado</span>
                    <span class="legend-item"><span class="dot reserved"></span> Reservado</span>
                </div>
                <div id="parkingGrid" class="parking-grid">
                    <div class="loading-spinner">Cargando...</div>
                </div>
            </div>
        </div>
    `;

    await refreshMap();
    setupGestorEvents();
}

// 3. EVENTOS (Aquí está la magia de la automatización)
function setupGestorEvents() {
    const input = document.getElementById('inputIngreso');
    const btn = document.getElementById('btnValidar');

    // Función de búsqueda
    const realizarBusqueda = async () => {
        const codigo = input.value.trim();
        if (codigo.length < 3) return; // No buscar si es muy corto

        try {
            const res = await authenticatedFetch('/gestor/scan', {
                method: 'POST',
                body: JSON.stringify({ codigo })
            });

            if (res.ok) {
                const data = await res.json();
                mostrarUsuarioEncontrado(data);
                // Feedback auditivo o visual opcional aquí
            } else {
                // Si no encuentra, limpiamos silenciosamente o mostramos error discreto
                if (codigo.length >= 8) { // Solo avisar si ya escribió un DNI completo
                    console.log("Usuario no encontrado");
                }
            }
        } catch (e) { console.error(e); }
    };

    // A. BÚSQUEDA AUTOMÁTICA AL ESCRIBIR
    input.addEventListener('input', (e) => {
        const val = e.target.value;
        
        // Si borra todo, limpiar tarjeta
        if (val === '') limpiarSeleccion();

        // 1. Si tiene 8 dígitos (DNI exacto) o formato placa (6-7), buscar YA
        if (val.length === 8 || (val.length >= 6 && val.includes('-'))) {
            clearTimeout(timerBusqueda);
            realizarBusqueda();
        } 
        // 2. Si no, esperar medio segundo a que termine de escribir (Debounce)
        else {
            clearTimeout(timerBusqueda);
            timerBusqueda = setTimeout(realizarBusqueda, 600);
        }
    });

    // B. Clic manual en botón lupa
    btn.onclick = realizarBusqueda;
}

function mostrarUsuarioEncontrado(data) {
    const card = document.getElementById('cardUsuario');
    const rolMap = { 2: 'ALUMNO', 3: 'DOCENTE', 1: 'ADMIN' };
    
    usuarioSeleccionado = data;

    // Llenar datos
    document.getElementById('foundNombre').textContent = data.usuario.nombre;
    document.getElementById('foundPlaca').innerHTML = `<i class="fas fa-car"></i> ${data.usuario.placa} (${data.usuario.modelo || '?'})`;
    document.getElementById('foundRol').textContent = rolMap[data.usuario.rol] || 'INVITADO';
    
    // Configurar estado y color
    const statusDiv = document.getElementById('foundStatus');
    const input = document.getElementById('inputIngreso');

    if (data.accion_sugerida === 'confirmar_ingreso') {
        statusDiv.innerHTML = `<span style="color:green; font-weight:bold">¡TIENE RESERVA!</span><br>Confirme haciendo clic en el mapa <b>(Espacio ${data.datos_accion.espacio_nro})</b>`;
        statusDiv.style.background = "#e8f5e9";
        input.style.borderColor = "#2ecc71"; // Borde verde
    } else if (data.accion_sugerida === 'registrar_salida') {
        statusDiv.innerHTML = `<span style="color:#1976d2; font-weight:bold">AUTO DENTRO</span><br>Clic en su espacio para dar SALIDA.`;
        statusDiv.style.background = "#e3f2fd";
        input.style.borderColor = "#2196f3"; // Borde azul
    } else {
        statusDiv.innerHTML = `<span style="color:#e67e22; font-weight:bold">SIN RESERVA</span><br>Seleccione un espacio VERDE para asignar.`;
        statusDiv.style.background = "#fff3e0";
        input.style.borderColor = "#ff9800"; // Borde naranja
    }

    card.classList.remove('hidden');
}

function limpiarSeleccion() {
    usuarioSeleccionado = null;
    document.getElementById('cardUsuario').classList.add('hidden');
    document.getElementById('inputIngreso').style.borderColor = "#ccc"; // Reset borde
    document.getElementById('inputIngreso').value = '';
    document.getElementById('inputIngreso').focus();
}

// 4. GESTIÓN DEL MAPA (Los 3 Escenarios)
async function gestionarEspacio(espacio) {
    
    // A. INGRESO MANUAL (Tengo usuario cargado, Espacio Libre)
    if (usuarioSeleccionado && espacio.estado === 'disponible') {
        if (confirm(`¿Asignar espacio ${espacio.numero} a ${usuarioSeleccionado.usuario.nombre}?`)) {
            await ejecutarAccionBackend('entrada_nueva', {
                id_usuario: usuarioSeleccionado.usuario.id,
                id_espacio: espacio.id
            });
            agregarLog(`Entrada Manual: ${usuarioSeleccionado.usuario.nombre}`, 'entrada');
            limpiarSeleccion();
        }
        return;
    }

    // B. CONFIRMAR RESERVA (Usuario cargado, Tiene reserva ahí)
    if (usuarioSeleccionado && usuarioSeleccionado.accion_sugerida === 'confirmar_ingreso') {
        if (espacio.id == usuarioSeleccionado.datos_accion.espacio_id) {
            // Confirmación rápida
            await ejecutarAccionBackend('entrada_reserva', {
                id_asignacion: usuarioSeleccionado.datos_accion.id_asignacion,
                id_espacio: espacio.id
            });
            agregarLog(`Reserva Confirmada: ${usuarioSeleccionado.usuario.nombre}`, 'entrada');
            limpiarSeleccion();
        } else {
            alert(`Este usuario va al espacio ${usuarioSeleccionado.datos_accion.espacio_nro}, no a este.`);
        }
        return;
    }

    // C. SALIDA RÁPIDA (Sin escanear, solo clic en rojo)
    if (espacio.estado === 'ocupado') {
        const nombre = espacio.ocupante_nombre || "Anónimo";
        if (confirm(`SALIDA: ¿Liberar el espacio ${espacio.numero} (${nombre})?`)) {
            if (espacio.id_asignacion) {
                // Salida oficial con registro
                await ejecutarAccionBackend('salida', {
                    id_asignacion: espacio.id_asignacion,
                    id_espacio: espacio.id
                });
                agregarLog(`Salida: ${nombre}`, 'salida');
            } else {
                // Salida manual (limpieza)
                await toggleEspacioManual(espacio.id, 'disponible');
                agregarLog(`Liberación manual: Espacio ${espacio.numero}`, 'alerta');
            }
        }
        return;
    }
}

// 5. RENDERIZADO Y KPIs
async function refreshMap() {
    try {
        const res = await authenticatedFetch('/espacios/disponibilidad');
        if (res.ok) {
            const data = await res.json();
            renderMap(data.espacios);
            updateKPIs(data.espacios); // <--- AQUÍ SE LLENA LA DATA
        }
    } catch(e) { console.error(e); }
}

function updateKPIs(lista) {
    if (!lista) return;
    
    // Contamos según lo que viene de BD
    const reservados = lista.filter(e => e.estado === 'espera' || e.estado_reserva === 'espera').length;
    
    // Disponibles reales (Verdes puros)
    const disponibles = lista.filter(e => e.estado === 'disponible' && e.estado_reserva !== 'espera').length;
    
    // Ocupados (Rojos)
    const ocupados = lista.filter(e => e.estado === 'ocupado').length;

    document.getElementById('lbl-libres').textContent = disponibles;
    document.getElementById('lbl-ocupados').textContent = ocupados;
    document.getElementById('lbl-reservados').textContent = reservados;
}

function renderMap(espacios) {
    const grid = document.getElementById('parkingGrid');
    if(!grid) return;
    grid.innerHTML = '';

    espacios.forEach(e => {
        const card = document.createElement('div');
        let clase = 'disponible';
        let iconoExtra = '';

        if (e.estado === 'ocupado') clase = 'ocupado';
        else if (e.estado === 'espera' || e.estado_reserva === 'espera') {
            clase = 'reservado';
            iconoExtra = '<i class="fas fa-clock"></i>';
        }

        card.className = `slot-card ${clase}`;
        
        let icon = 'car';
        if (e.tipo === 'moto') icon = 'motorcycle';
        if (e.tipo.includes('disca')) icon = 'wheelchair';

        const quien = e.ocupante_nombre ? `\n👤 ${e.ocupante_nombre}` : '';
        const placa = e.ocupante_placa ? e.ocupante_placa : e.tipo;

        card.title = `Espacio ${e.numero} (${e.estado})${quien}`;
        card.innerHTML = `
            <div class="slot-number">${e.numero} <span style="font-size:0.7em">${iconoExtra}</span></div>
            <div class="slot-icon"><i class="fas fa-${icon}"></i></div>
            <small>${placa}</small>
        `;
        card.onclick = () => gestionarEspacio(e);
        grid.appendChild(card);
    });
}

// Helpers
// En frontend/js/gestor.js

async function ejecutarAccionBackend(tipo, datos) {
    try {
        const res = await authenticatedFetch('/gestor/ejecutar-accion', {
            method: 'POST',
            body: JSON.stringify({ tipo, ...datos })
        });
        
        const respuesta = await res.json(); // Leemos la respuesta JSON siempre

        if (res.ok) {
            await refreshMap();
            // Log visual
            let textoLog = "Acción completada";
            if (tipo.includes('entrada')) textoLog = "Entrada registrada";
            if (tipo === 'salida') textoLog = "Salida registrada";
            agregarLog(textoLog, tipo === 'salida' ? 'salida' : 'entrada');
            
            alert(respuesta.mensaje || "Acción registrada correctamente.");
        } else {
            // AQUÍ ESTÁ EL CAMBIO: Mostramos el error específico
            alert(respuesta.error || "Error desconocido en el servidor.");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión con el sistema.");
    }
}

async function toggleEspacioManual(id, estado) {
    await authenticatedFetch('/gestor/cambiar-estado', {
        method: 'POST', body: JSON.stringify({ id_espacio: id, nuevo_estado: estado })
    });
    await refreshMap();
}

function agregarLog(msg, tipo) {
    const lista = document.getElementById('listaMovimientos');
    if(!lista) return;
    const li = document.createElement('li');
    const hora = new Date().toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'});
    let color = tipo === 'entrada' ? 'green' : (tipo === 'salida' ? 'blue' : 'gray');
    
    li.innerHTML = `<span style="color:#999; font-size:0.8em">${hora}</span> <span style="color:${color}">${msg}</span>`;
    li.style.borderBottom = "1px solid #f0f0f0";
    li.style.padding = "5px 0";
    
    lista.prepend(li);
}

function loadScript(src, cb) {
    const s = document.createElement('script'); s.src=src; s.onload=cb; document.body.appendChild(s);
}
function getUser() {
    const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null;
}