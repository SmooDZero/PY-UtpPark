// frontend/js/student.js - CÓDIGO COMPLETO

function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// 1. VARIABLES GLOBALES
let sedeSeleccionada = 'Arequipa'; 

// 2. ROUTER PRINCIPAL (Controla qué pantalla se ve)
window.loadStudentSection = async function(sectionId) {
    const mainContent = document.getElementById('mainContent');
    const user = getUser(); // Usamos la función auxiliar del final
    switch(sectionId) {
        case 'inicio':
        case 'dashboard': 
            await renderMiPase(mainContent, user);
            break;
        case 'vehiculo':
            await renderMiVehiculo(mainContent, user);
            break;
        case 'chatbot':
            await renderChatbotPage(mainContent, user);
            break;
        default:
            await renderMiPase(mainContent, user);
    }
};

// 3. VISTA: MI PASE (Home)
async function renderMiPase(container, user) {

    // limpiamos por seguridad
    container.innerHTML = "";
    // Lógica para diferenciar Docente vs Estudiante
    const esDocente = parseInt(user.rol) === 3;
    const claseTarjeta = esDocente ? 'id-card-digital docente' : 'id-card-digital';
    const etiquetaRol = esDocente ? 'DOCENTE UTP' : 'ESTUDIANTE';

    // Renderizado del HTML
    container.innerHTML = `
        <div class="student-container">
            <div class="student-header">
                <div>
                    <h1>Hola, ${user.nombre.split(' ')[0]}</h1>
                    <p class="subtitle">Bienvenido a UTP Park</p>
                </div>
                <div class="sede-selector">
                    <select id="selectSede" onchange="cambiarSede(this.value)">
                        <option value="Arequipa" ${sedeSeleccionada === 'Arequipa' ? 'selected' : ''}>Torre Arequipa</option>
                        <option value="Petit thouars" ${sedeSeleccionada === 'Petit thouars' ? 'selected' : ''}>Petit Thouars</option>
                        <option value="Medicina" ${sedeSeleccionada === 'Medicina' ? 'selected' : ''}> Medicina</option>
                        <option value="Pacífico" ${sedeSeleccionada === 'Pacífico' ? 'selected' : ''}>Pacífico</option>
                    </select>
                </div>
            </div>

            <div class="${claseTarjeta}">
                <div class="card-top">
                    <img src="img/UTP+Portal.png" class="card-logo" alt="UTP">
                    <span class="card-role">${etiquetaRol}</span>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <label>Nombre</label>
                        <h3>${user.nombre}</h3>
                        <label>Código / DNI</label>
                        <h3>${user.dni || user.codigo}</h3>
                    </div>
                    <div class="barcode-area">
                        <svg id="barcode"></svg>
                    </div>
                </div>
            </div>

            <div class="traffic-light-card">
                <div class="traffic-header">
                    <h3>Estado en <span id="lblSede">${sedeSeleccionada}</span></h3>
                    <div id="semaforoIcon" class="status-circle gray"></div>
                </div>
                <div class="traffic-body">
                    <h2 id="txtDisponibilidad">Cargando...</h2>
                    <p id="txtDetalle">Consultando espacios...</p>
                </div>
            </div>

            <div class="action-area">
                <button class="btn-reservar-chat" onclick="irAlChatbot()">
                    <i class="fas fa-comment-dots"></i> Reservar espacio con Chatbot
                </button>
            </div>
        </div>
    `;

    // Generar Código de Barras Real (Si la librería cargó)
    if (window.JsBarcode && (user.dni || user.codigo)) {
        try {
            JsBarcode("#barcode", user.dni || user.codigo, {
                format: "CODE128",
                lineColor: "#333",
                width: 2,
                height: 40,
                displayValue: false
            });
        } catch(e) { console.error("Error Barcode:", e); }
    }

    // Cargar datos del Semáforo
    await actualizarSemaforo();
    await renderTarjetaReserva(container);
}




// 4. VISTA: MI VEHÍCULO
async function actualizarSemaforo() {
    try {
        const res = await authenticatedFetch('/espacios/disponibilidad');
        if (!res.ok) throw new Error("Fallo fetch");

        const data = await res.json();

        const espaciosSede = data.espacios.filter(e =>
            normalizar(e.ubicacion).includes(normalizar(sedeSeleccionada))
        );

        // PINTAR SEMÁFORO
        const total = espaciosSede.length;
        const disponibles = espaciosSede.filter(e => e.estado === 'disponible').length;

        const semaforoEl = document.getElementById('semaforoIcon');
        const txtDisp = document.getElementById('txtDisponibilidad');
        const txtDet = document.getElementById('txtDetalle');

        if (total === 0) {
            semaforoEl.className = 'status-circle gray';
            txtDisp.textContent = "Sin Datos";
            txtDet.textContent = "No hay espacios registrados.";
        } else if (disponibles > 0) {
            semaforoEl.className = 'status-circle green';
            txtDisp.textContent = "DISPONIBLE";
            txtDisp.style.color = "#2ecc71";
            txtDet.textContent = `Hay ${disponibles} espacios libres.`;
        } else {
            semaforoEl.className = 'status-circle red';
            txtDisp.textContent = "LLENO";
            txtDisp.style.color = "#e74c3c";
            txtDet.textContent = "No hay vacantes ahora.";
        }

    } catch (e) {
        console.error("Error en actualizarSemaforo():", e);
    }
}


async function renderMiVehiculo(container, user) {

    // 1. Obtener datos del vehículo del usuario
    const resPerfil = await authenticatedFetch('/users/profile');
    const perfil = await resPerfil.json();

    // 2. Obtener datos del espacio asignado (si existe)
    const resReserva = await authenticatedFetch('/users/vehiculo_detalles');
    const datos = await resReserva.json();

    // Construir HTML final
    container.innerHTML = `
        <div class="vehiculo-card">
            <h2>Mi Vehículo Registrado</h2>

            ${!perfil.placa ? `
                <p>No tiene ningún vehículo registrado.</p>
            ` : `
                <div class="vehiculo-info">
                    <p><strong>Placa:</strong> ${perfil.placa}</p>
                    <p><strong>Marca:</strong> ${perfil.marca}</p>
                    <p><strong>Modelo:</strong> ${perfil.modelo}</p>
                    <p><strong>Tipo:</strong> ${perfil.tipo}</p>
                    <p><strong>Estado:</strong> Habilitado</p>
                </div>
            `}
        </div>

        
    `;
}



// 5. VISTA: CHATBOT INTEGRADO
async function renderChatbotPage(container, user) {
    container.innerHTML = `
        <div class="chatbot-page-container">
            <div class="chatbot-header-embedded">
                <h2>Asistente UTP Park</h2>
                <p>Pídeme reservar un espacio o consulta reglas.</p>
            </div>
            
            <div class="chatbot-body embedded" id="chatBody">
                <div class="chatbot-messages" id="chatbotMessagesPage">
                    <div class="chatbot-message bot">
                        <p>Hola ${user.nombre.split(' ')[0]}. ¿En qué puedo ayudarte hoy?</p>
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <button class="chip" onclick="enviarMensajeChat('Quiero reservar un espacio en ${sedeSeleccionada}')">🚗 Reservar Aquí</button>
                <button class="chip" onclick="enviarMensajeChat('¿Hay espacios en ${sedeSeleccionada}?')">🔍 Disponibilidad</button>
            </div>

            <div class="chatbot-input-area">
                <input type="text" id="chatInputPage" placeholder="Escribe tu mensaje...">
                <button id="btnSendPage"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    // Event listeners del chat
    const btn = document.getElementById('btnSendPage');
    const input = document.getElementById('chatInputPage');
    const enviar = () => {
        const txt = input.value.trim();
        if(txt) enviarMensajeChat(txt);
        input.value = '';
    };
    btn.onclick = enviar;
    input.addEventListener('keypress', (e) => { if(e.key === 'Enter') enviar() });
}

// 6. FUNCIONES AUXILIARES (Lógica de negocio)

async function enviarMensajeChat(texto) {
    const chatContainer = document.getElementById('chatbotMessagesPage');
    if(!chatContainer) return;

    const user = getUser();
    const idUsuario = user.id || user.user_id;

    chatContainer.innerHTML += `<div class="chatbot-message user"><p>${texto}</p></div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const loadingId = 'load-' + Date.now();
    chatContainer.innerHTML += `<div class="chatbot-message bot" id="${loadingId}"><p>Pensando...</p></div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const res = await authenticatedFetch('/chatbot/pregunta', {
            method: 'POST',
            body: JSON.stringify({
                pregunta: texto,
                id_usuario: idUsuario,
                id_edificio: obtenerIdEdificio(sedeSeleccionada)
            })
        });

        if (!res.ok) {
            throw new Error("Respuesta no OK del servidor");
        }

        const data = await res.json();

        document.getElementById(loadingId).remove();
        chatContainer.innerHTML += `<div class="chatbot-message bot"><p>${data.respuesta}</p></div>`;
        chatContainer.scrollTop = chatContainer.scrollHeight;

    } catch (e) {
        console.error("❌ Error en Chatbot:", e);
        const el = document.getElementById(loadingId);
        if (el) el.innerText = "Error de conexión con el servidor.";
    }
}


function obtenerIdEdificio(nombre) {
    if (!nombre) return null;

    nombre = nombre.toLowerCase();

    if (nombre.includes("arequipa")) return 2;
    if (nombre.includes("petit")) return 1;
    if (nombre.includes("medicina")) return 4;
    if (nombre.includes("pac")) return 3;

    return null;
}



window.cambiarSede = function(nuevaSede) {
    sedeSeleccionada = nuevaSede;
    const lbl = document.getElementById('lblSede');
    if(lbl) lbl.textContent = nuevaSede;
    actualizarSemaforo();
};

window.irAlChatbot = function() {
    // Buscamos el ítem del menú que lleva al chatbot y le hacemos click
    const menuLink = document.querySelector('[data-section="chatbot"]');
    if(menuLink) menuLink.click();
};



// 7. UTILIDAD: OBTENER USUARIO (Para no depender de archivos externos)
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : { nombre: 'Usuario', rol: 2 };
}


async function renderTarjetaReserva(container) {
    try {
        const res = await authenticatedFetch('/users/reserva');
        if (!res.ok) return;

        const data = await res.json();
        if (!data.tiene_reserva) return;

        const estado = data.estado;
        const esActivo = estado === "activo";

        let horaInicio = data.hora_inicio ? new Date(data.hora_inicio) : null;
        let fechaSolicitud = new Date(data.fecha_solicitud);

        let tarjeta = document.createElement("div");
        tarjeta.id = "tarjetaReserva";

        tarjeta.className = esActivo 
            ? "reserva-card active" 
            : "reserva-card pending";

        tarjeta.innerHTML = `
            <div class="reserva-header">
                <i class="fas fa-ticket-alt"></i>
                <h3>${esActivo ? "Reserva en Curso" : "Mi Reserva Actual"}</h3>
            </div>

            <div class="reserva-body">
                <p><strong>📍 Edificio:</strong> ${data.nombre_edificio}</p>
                <p><strong>🅿️ Espacio:</strong> ${data.numero_espacio}</p>
                <p><strong>📅 Solicitud:</strong> ${fechaSolicitud.toLocaleString()}</p>

                ${
                    esActivo
                    ? `<p><strong>⏳ Tiempo transcurrido:</strong> <span id="cronometroReserva">00:00:00</span></p>` 
                    : `<p><em>🟡 Dirígete al edificio para validar tu ingreso</em></p>`
                }
            </div>
        `;

        container.appendChild(tarjeta);

        if (esActivo && horaInicio) {
            iniciarCronometro(horaInicio);
        }

    } catch (e) {
        console.error("Error renderTarjetaReserva():", e);
    }
}

function iniciarCronometro(inicio) {
    function actualizar() {
        const ahora = new Date();
        let diff = Math.floor((ahora - inicio) / 1000);

        const h = String(Math.floor(diff / 3600)).padStart(2, "0");
        diff %= 3600;

        const m = String(Math.floor(diff / 60)).padStart(2, "0");
        const s = String(diff % 60).padStart(2, "0");

        document.getElementById("cronometroReserva").textContent = `${h}:${m}:${s}`;
    }

    actualizar();
    setInterval(actualizar, 1000);
}
