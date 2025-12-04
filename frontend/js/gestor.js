// frontend/js/gestor.js

// 1. Guardamos la función original (la que usan los alumnos en dashboard.js)
// para no romperles su vista.
const originalLoadSection = window.loadSection;

// 2. Sobrescribimos la función maestra de carga
window.loadSection = async function(sectionId) {
    const user = getUser();
    const ROL_GESTOR = 4; // ID 4 en tu base de datos

    // === CASO A: SI EL USUARIO ES GESTOR ===
    if (user && parseInt(user.rol) === ROL_GESTOR) {
        
        // El menú del gestor en index.js envía a 'espacios', 'dashboard' o 'inicio'
        if (sectionId === 'espacios' || sectionId === 'dashboard' || sectionId === 'inicio') {
            await loadGestorView();
        } 
        else if (sectionId === 'usuarios') {
            // Reutilizamos la tabla de usuarios del Admin (ya que es igual)
            if (typeof window.routeAdminSections === 'function') {
                window.routeAdminSections('usuarios');
            } else {
                // Si admin.js no cargó, forzamos carga (fallback)
                const script = document.createElement('script');
                script.src = 'frontend/js/admin.js';
                script.onload = () => window.routeAdminSections('usuarios');
                document.body.appendChild(script);
            }
        }
        else if (sectionId === 'chatbot') {
            // Abrir chatbot
            if (window.openChatbot) window.openChatbot();
        }
    } 
    // === CASO B: SI ES ALUMNO O PROFESOR ===
    else {
        // Le devolvemos el control a dashboard.js
        if (typeof originalLoadSection === 'function') {
            originalLoadSection(sectionId);
        }
    }
};

// --- VISTA PRINCIPAL DEL GESTOR (LA CASETA) ---
async function loadGestorView() {
    const mainContent = document.getElementById('mainContent');
    
    // ESTRUCTURA VISUAL (Igual que antes, pero asegurando que cargue)
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
                </div>

                <div class="scanner-box">
                    <h3><i class="fas fa-barcode"></i> Validación de Ingreso</h3>
                    <p>Ingrese Placa o DNI:</p>
                    <div class="input-group-lg">
                        <input type="text" id="inputIngreso" placeholder="AAA-123" autocomplete="off">
                        <button id="btnValidar" class="btn-scan"><i class="fas fa-search"></i></button>
                    </div>
                </div>

                <div class="actions-log">
                    <h4><i class="fas fa-history"></i> Actividad Reciente</h4>
                    <ul id="listaMovimientos" class="log-list">
                        <li class="empty-log">Esperando vehículos...</li>
                    </ul>
                </div>
            </div>

            <div class="map-panel">
                <div class="map-header">
                    <h2><i class="fas fa-map-marked-alt"></i> Mapa del Estacionamiento</h2>
                    <button class="btn-refresh" onclick="refreshMap()"><i class="fas fa-sync-alt"></i> Actualizar</button>
                </div>
                
                <div class="map-legend">
                    <span class="legend-item"><span class="dot free"></span> Libre</span>
                    <span class="legend-item"><span class="dot busy"></span> Ocupado</span>
                </div>

                <div id="parkingGrid" class="parking-grid">
                    <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando mapa...</div>
                </div>
            </div>
        </div>
    `;

    // Cargar datos reales
    await refreshMap();
    setupGestorEvents();
}

// --- LÓGICA DE DATOS ---
async function refreshMap() {
    try {
        const response = await authenticatedFetch('/espacios/disponibilidad');
        if (!response || !response.ok) return;

        const data = await response.json();
        
        // 1. Renderizar Mapa y KPIs
        renderMap(data.espacios);
        updateKPIs(data.estadisticas);

        // 2. ACTUALIZACIÓN VISUAL: Mostrar en qué edificio estamos
        const tituloMapa = document.querySelector('.map-header h2');
        if (tituloMapa && data.ubicacion_actual) {
            tituloMapa.innerHTML = `<i class="fas fa-map-marked-alt"></i> Mapa: ${data.ubicacion_actual}`;
        }

    } catch (error) {
        console.error("Error mapa:", error);
    }
}

function renderMap(espacios) {
    const grid = document.getElementById('parkingGrid');
    if(!grid) return;
    grid.innerHTML = ''; 

    espacios.forEach(espacio => {
        const card = document.createElement('div');
        // Validamos estado para clase CSS
        const estadoClase = espacio.estado === 'disponible' ? 'disponible' : 'ocupado';
        
        card.className = `slot-card ${estadoClase}`;
        
        // Iconos según tipo
        let icon = 'car';
        if(espacio.tipo === 'moto') icon = 'motorcycle';
        if(espacio.tipo.includes('discapacitado')) icon = 'wheelchair';

        card.innerHTML = `
            <div class="slot-number">${espacio.numero}</div>
            <div class="slot-icon"><i class="fas fa-${icon}"></i></div>
            <div class="slot-status">${espacio.ubicacion}</div>
        `;

        // Acción al hacer click
        card.onclick = () => gestionarEspacio(espacio);
        grid.appendChild(card);
    });
}

function updateKPIs(stats) {
    if(!stats) return;
    const lblLibres = document.getElementById('lbl-libres');
    const lblOcupados = document.getElementById('lbl-ocupados');
    if(lblLibres) lblLibres.textContent = stats.disponibles;
    if(lblOcupados) lblOcupados.textContent = stats.ocupados;
}

function setupGestorEvents() {
    const btn = document.getElementById('btnValidar');
    const input = document.getElementById('inputIngreso');

    if(btn && input) {
        btn.onclick = () => {
            const val = input.value.trim();
            if(val) alert(`Funcionalidad de búsqueda para: ${val} (Próximamente)`);
        };
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btn.click();
        });
    }
}

// Reemplaza la función gestionarEspacio en frontend/js/gestor.js

async function gestionarEspacio(espacio) {
    let nuevoEstado = '';
    let confirmacion = false;

    // Lógica de Toggle: Si está libre -> Ocupar. Si está ocupado -> Liberar.
    if (espacio.estado === 'disponible') {
        // Opción A: Ocupar manual (simulando que llegó un auto sin reserva)
        nuevoEstado = 'ocupado';
        confirmacion = confirm(`El espacio ${espacio.numero} está LIBRE.\n¿Desea marcarlo como OCUPADO (llegó un auto)?`);
    } else {
        // Opción B: Liberar (el auto se fue)
        nuevoEstado = 'disponible';
        confirmacion = confirm(`El espacio ${espacio.numero} está OCUPADO.\n¿El auto se ha retirado? (Liberar espacio)`);
    }

    if (confirmacion) {
        try {
            const res = await authenticatedFetch('/gestor/cambiar-estado', {
                method: 'POST',
                body: JSON.stringify({
                    id_espacio: espacio.id, // Asegúrate que el backend envíe 'id' en /espacios/disponibilidad
                    nuevo_estado: nuevoEstado
                })
            });

            if (res.ok) {
                // Éxito: Recargar el mapa para ver el cambio de color
                await refreshMap();
                
                // Feedback visual simple
                alert(`¡Listo! Espacio ${espacio.numero} ahora está ${nuevoEstado.toUpperCase()}.`);
            } else {
                alert("Error al actualizar el espacio.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión.");
        }
    }
}

// Helper para obtener usuario (si no está global)
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}