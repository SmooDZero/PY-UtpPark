// frontend/js/gestor.js

// === VARIABLES GLOBALES ===
let usuarioSeleccionado = null; // Aquí guardamos al usuario buscado

// 1. ROUTER
const originalLoadSection = window.loadSection;
window.loadSection = async function(sectionId) {
    const user = getUser();
    const ROL_GESTOR = 4;

    if (user && parseInt(user.rol) === ROL_GESTOR) {
        if (sectionId === 'espacios' || sectionId === 'dashboard' || sectionId === 'inicio') {
            await loadGestorView();
        } else if (sectionId === 'usuarios') {
            if (typeof window.routeAdminSections === 'function') window.routeAdminSections('usuarios');
            else loadScript('frontend/js/admin.js', () => window.routeAdminSections('usuarios'));
        }
    } else {
        if (typeof originalLoadSection === 'function') originalLoadSection(sectionId);
    }
};

// 2. VISTA PRINCIPAL
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
                    <p>Escanear DNI o Placa:</p>
                    <div class="input-group-lg">
                        <input type="text" id="inputIngreso" placeholder="DNI / PLACA" autocomplete="off">
                        <button id="btnValidar" class="btn-scan"><i class="fas fa-search"></i></button>
                    </div>
                    
                    <div id="cardUsuario" class="user-found-card hidden">
                        <div class="found-header">
                            <span class="badge-role" id="foundRol">ALUMNO</span>
                            <button class="btn-close-found" onclick="limpiarSeleccion()">&times;</button>
                        </div>
                        <h4 id="foundNombre">Nombre Usuario</h4>
                        <p id="foundPlaca"><i class="fas fa-car"></i> ABC-123</p>
                        <div id="foundStatus" class="found-status">Seleccione un espacio en el mapa para asignar</div>
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

// 3. LÓGICA DE BÚSQUEDA (Escáner)
function setupGestorEvents() {
    const btn = document.getElementById('btnValidar');
    const input = document.getElementById('inputIngreso');

    const realizarBusqueda = async () => {
        const codigo = input.value.trim();
        if (!codigo) return;

        try {
            const res = await authenticatedFetch('/gestor/scan', {
                method: 'POST',
                body: JSON.stringify({ codigo })
            });

            if (res.ok) {
                const data = await res.json();
                mostrarUsuarioEncontrado(data);
            } else {
                alert("Usuario no encontrado o no pertenece a esta sede.");
                limpiarSeleccion();
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    btn.onclick = realizarBusqueda;
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') realizarBusqueda() });
}

function mostrarUsuarioEncontrado(data) {
    const card = document.getElementById('cardUsuario');
    const rolMap = { 2: 'ALUMNO', 3: 'DOCENTE', 1: 'ADMIN' };
    
    // Guardamos en memoria global
    usuarioSeleccionado = data;

    // Pintamos la tarjeta
    document.getElementById('foundNombre').textContent = data.usuario.nombre;
    document.getElementById('foundPlaca').innerHTML = `<i class="fas fa-car"></i> ${data.usuario.placa} (${data.usuario.modelo || 'Generico'})`;
    document.getElementById('foundRol').textContent = rolMap[data.usuario.rol] || 'USUARIO';
    
    // Cambiar color según acción sugerida
    const statusDiv = document.getElementById('foundStatus');
    if (data.accion_sugerida === 'confirmar_ingreso') {
        statusDiv.innerHTML = `<span style="color:green">¡TIENE RESERVA!</span> <br> Haga clic en <b>${data.datos_accion.espacio_nro}</b> para confirmar.`;
        statusDiv.style.background = "#e8f5e9";
    } else if (data.accion_sugerida === 'registrar_salida') {
        statusDiv.innerHTML = `<span style="color:blue">EN SALIDA</span> <br> Haga clic en su espacio para liberar.`;
        statusDiv.style.background = "#e3f2fd";
    } else {
        statusDiv.innerHTML = `SIN RESERVA <br> <i class="fas fa-hand-point-right"></i> Toque un espacio <b>VERDE</b> para asignar.`;
        statusDiv.style.background = "#fff3e0";
    }

    card.classList.remove('hidden');
}

function limpiarSeleccion() {
    usuarioSeleccionado = null;
    document.getElementById('cardUsuario').classList.add('hidden');
    document.getElementById('inputIngreso').value = '';
    document.getElementById('inputIngreso').focus();
}

// 4. LÓGICA DE CLIC EN EL MAPA (Asignación)
async function gestionarEspacio(espacio) {
    
    // CASO 1: ASIGNAR A USUARIO SELECCIONADO (El Input manda)
    if (usuarioSeleccionado && espacio.estado === 'disponible') {
        if (confirm(`¿Asignar espacio ${espacio.numero} a ${usuarioSeleccionado.usuario.nombre}?`)) {
            await ejecutarAccionBackend('entrada_nueva', {
                id_usuario: usuarioSeleccionado.usuario.id,
                id_espacio: espacio.id
            });
            limpiarSeleccion(); // Resetear para el siguiente
        }
        return;
    }

    // CASO 2: CONFIRMAR RESERVA (El Usuario ya tiene sitio asignado)
    if (usuarioSeleccionado && usuarioSeleccionado.accion_sugerida === 'confirmar_ingreso') {
        // Verificar si el gestor hizo clic en el espacio CORRECTO
        if (espacio.id == usuarioSeleccionado.datos_accion.espacio_id) {
            if(confirm("¿Confirmar ingreso de reserva?")) {
                await ejecutarAccionBackend('entrada_reserva', {
                    id_asignacion: usuarioSeleccionado.datos_accion.id_asignacion,
                    id_espacio: espacio.id
                });
                limpiarSeleccion();
            }
        } else {
            alert(`Error: Este usuario tiene reservado el espacio ${usuarioSeleccionado.datos_accion.espacio_nro}, no este.`);
        }
        return;
    }

    // CASO 3: LIBERAR ESPACIO (Salida)
    if (espacio.estado === 'ocupado') {
        const nombreOcupante = espacio.ocupante_nombre || "Desconocido";
        if (confirm(`El espacio ${espacio.numero} está ocupado por ${nombreOcupante}.\n¿Registrar SALIDA y liberar?`)) {
            // Necesitamos el ID de asignacion que viene del mapa (Paso 1)
            if (espacio.id_asignacion) {
                await ejecutarAccionBackend('salida', {
                    id_asignacion: espacio.id_asignacion,
                    id_espacio: espacio.id
                });
            } else {
                // Fallback manual si no hay asignacion vinculada
                await toggleEspacioManual(espacio.id, 'disponible');
            }
        }
        return;
    }

    // CASO 4: OCUPACIÓN MANUAL GENÉRICA (Sin DNI)
    if (!usuarioSeleccionado && espacio.estado === 'disponible') {
        if(confirm(`Espacio ${espacio.numero}: ¿Marcar como OCUPADO (Anónimo/Invitado)?`)) {
            await toggleEspacioManual(espacio.id, 'ocupado');
        }
    }
}

// Helpers de conexión
async function ejecutarAccionBackend(tipo, datos) {
    try {
        const res = await authenticatedFetch('/gestor/ejecutar-accion', {
            method: 'POST',
            body: JSON.stringify({ tipo, ...datos })
        });
        if (res.ok) {
            await refreshMap();
              let textoLog = "Acción completada";
              if (tipo.includes('entrada')) textoLog = "Entrada registrada";
              if (tipo === 'salida') textoLog = "Salida registrada";
    agregarLog(textoLog, tipo === 'salida' ? 'salida' : 'entrada');
            alert("Acción registrada correctamente.");
        } else {
            alert("Error al procesar acción.");
        }
    } catch (e) { console.error(e); }
}

async function toggleEspacioManual(id, estado) {
    await authenticatedFetch('/gestor/cambiar-estado', {
        method: 'POST',
        body: JSON.stringify({ id_espacio: id, nuevo_estado: estado })
    });
    await refreshMap();
const accion = estado === 'ocupado' ? 'Ocupación manual' : 'Liberación manual';
agregarLog(`${accion} en espacio (ID: ${id})`, 'info');
}

// ... (refreshMap, renderMap, updateKPIs, loadScript, getUser se mantienen igual o se copian del anterior) ...
// Para ahorrar espacio, asegúrate de incluir refreshMap, renderMap y updateKPIs aquí abajo
// Recuerda en renderMap leer: espacio.ocupante_nombre y espacio.id_asignacion
async function refreshMap() {
    try {
        const res = await authenticatedFetch('/espacios/disponibilidad');
        if (res.ok) {
            const data = await res.json();
            renderMap(data.espacios);
            updateKPIs(data.estadisticas, data.espacios);
        }
    } catch(e) {}
}

function renderMap(espacios) {
    const grid = document.getElementById('parkingGrid');
    if(!grid) return;
    grid.innerHTML = '';

    espacios.forEach(e => {
        const card = document.createElement('div');
        
        // --- LÓGICA DE COLORES CORREGIDA ---
        let clase = 'disponible'; // Por defecto verde
        let iconoAdicional = '';

        if (e.estado === 'ocupado') {
            clase = 'ocupado'; // Rojo
        } 
        // Si el estado físico es 'espera' O hay una reserva en camino
        else if (e.estado === 'espera' || e.estado_reserva === 'espera') {
            clase = 'reservado'; // Amarillo (Clase nueva)
            iconoAdicional = '<i class="fas fa-clock" style="font-size:0.8rem; margin-left:5px"></i>';
        }

        card.className = `slot-card ${clase}`;
        
        // Icono inteligente según tipo
        let icon = 'car';
        if (e.tipo === 'moto') icon = 'motorcycle';
        if (e.tipo.includes('disca')) icon = 'wheelchair';

        // Tooltip con información
        let titulo = `Espacio ${e.numero}: ${e.estado.toUpperCase()}`;
        if (e.ocupante_nombre) titulo += `\nOcupado por: ${e.ocupante_nombre}`;

        card.innerHTML = `
            <div class="slot-number">${e.numero} ${iconoAdicional}</div>
            <div class="slot-icon"><i class="fas fa-${icon}"></i></div>
            <small>${e.ocupante_placa || e.tipo}</small>
        `;
        
        card.title = titulo;
        card.onclick = () => gestionarEspacio(e);
        grid.appendChild(card);
    });
}



function updateKPIs(listaEspacios) {
    // Protección contra listas vacías
    if (!listaEspacios) return;

    // 1. Contar RESERVADOS (Amarillos)
    // Son los que están en estado físico 'espera' O tienen una reserva activa tipo 'espera'
    const reservados = listaEspacios.filter(e => 
        e.estado === 'espera' || e.estado_reserva === 'espera'
    ).length;

    // 2. Contar DISPONIBLES (Verdes)
    // Estrictamente disponibles y SIN reserva pendiente
    const disponibles = listaEspacios.filter(e => 
        e.estado === 'disponible' && e.estado_reserva !== 'espera'
    ).length;
    
    // 3. Contar OCUPADOS (Rojos)
    // El resto (Total menos verdes y amarillos)
    const ocupados = listaEspacios.length - disponibles - reservados;

    // 4. Inyectar en el HTML
    const elLibres = document.getElementById('lbl-libres');
    const elOcupados = document.getElementById('lbl-ocupados');
    const elReservados = document.getElementById('lbl-reservados');

    if(elLibres) elLibres.textContent = disponibles;
    if(elOcupados) elOcupados.textContent = ocupados;
    if(elReservados) elReservados.textContent = reservados;
}


// --- FUNCIÓN DE LOG VISUAL (ACTIVIDAD RECIENTE) ---
function agregarLog(mensaje, tipo = 'info') {
    const lista = document.getElementById('listaMovimientos');
    if (!lista) return;

    // Crear el elemento de lista
    const li = document.createElement('li');
    const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    
    // Icono según tipo
    let icono = '<i class="fas fa-info-circle"></i>';
    if (tipo === 'entrada') icono = '<i class="fas fa-car-side" style="color:green"></i>';
    if (tipo === 'salida') icono = '<i class="fas fa-sign-out-alt" style="color:blue"></i>';
    if (tipo === 'alerta') icono = '<i class="fas fa-exclamation-triangle" style="color:orange"></i>';

    li.innerHTML = `
        <span class="log-time">${hora}</span>
        <span class="log-msg">${icono} ${mensaje}</span>
    `;
    
    // Estilo básico en JS para el item (puedes pasarlo a CSS luego)
    li.style.borderBottom = '1px solid #eee';
    li.style.padding = '8px 0';
    li.style.fontSize = '0.9rem';
    li.style.display = 'flex';
    li.style.gap = '10px';

    // Insertar al principio (el más reciente arriba)
    lista.prepend(li);

    // Mantener solo los últimos 5
    if (lista.children.length > 5) {
        lista.removeChild(lista.lastChild);
    }
}