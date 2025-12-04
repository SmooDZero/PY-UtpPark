// frontend/js/student.js - CÓDIGO COMPLETO

// 1. VARIABLES GLOBALES
let sedeSeleccionada = 'Arequipa'; 

// 2. ROUTER PRINCIPAL (Controla qué pantalla se ve)
window.loadStudentSection = async function(sectionId) {
    const mainContent = document.getElementById('mainContent');
    const user = getUser(); // Usamos la función auxiliar del final

    // Limpiamos contenido previo
    mainContent.innerHTML = '';

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
                        <option value="Medicina" ${sedeSeleccionada === 'Medicina' ? 'selected' : ''}>F. Medicina</option>
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
}

// 4. VISTA: MI VEHÍCULO
async function renderMiVehiculo(container, user) {
    container.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando vehículo...</div>`;
    
    try {
        const res = await authenticatedFetch('/users/profile');
        if (!res.ok) throw new Error("Error al cargar perfil");
        const data = await res.json();

        container.innerHTML = `
            <div class="student-container">
                <h2>Mi Vehículo Registrado</h2>
                ${data.placa ? `
                    <div class="vehicle-card">
                        <div class="plate-display">${data.placa}</div>
                        <div class="vehicle-details">
                            <p><strong>Marca:</strong> ${data.marca}</p>
                            <p><strong>Modelo:</strong> ${data.modelo}</p>
                            <p><strong>Tipo:</strong> ${data.tipo}</p>
                        </div>
                        <div class="status-alert success">
                            <i class="fas fa-check-circle"></i> Vehículo Habilitado
                        </div>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-car-crash"></i>
                        <p>No tienes un vehículo registrado.</p>
                        <button class="btn-primary" onclick="alert('Contacta a Servicios Estudiantiles')">Solicitar Registro</button>
                    </div>
                `}
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<p class="error">Error cargando información.</p>`;
    }
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
                <button class="chip" onclick="enviarMensajeChat('¿Hay espacios en Torre Arequipa?')">🔍 Disponibilidad</button>
                <button class="chip" onclick="enviarMensajeChat('¿Cuáles son los horarios?')">🕒 Horarios</button>
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

    chatContainer.innerHTML += `<div class="chatbot-message user"><p>${texto}</p></div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const loadingId = 'load-' + Date.now();
    chatContainer.innerHTML += `<div class="chatbot-message bot" id="${loadingId}"><p>Pensando...</p></div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const res = await authenticatedFetch('/chatbot/pregunta', {
            method: 'POST',
            body: JSON.stringify({ pregunta: texto })
        });
        const data = await res.json();
        document.getElementById(loadingId).remove();
        chatContainer.innerHTML += `<div class="chatbot-message bot"><p>${data.respuesta}</p></div>`;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (e) {
        if(document.getElementById(loadingId)) 
            document.getElementById(loadingId).innerText = "Error de conexión.";
    }
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

async function actualizarSemaforo() {
    const semaforoEl = document.getElementById('semaforoIcon');
    const txtDisp = document.getElementById('txtDisponibilidad');
    const txtDet = document.getElementById('txtDetalle');

    if(!semaforoEl) return;

    try {
        const res = await authenticatedFetch('/espacios/disponibilidad');
        if(!res || !res.ok) throw new Error("Fallo fetch");
        
        const data = await res.json();

        // Filtro flexible por nombre de sede
        const espaciosSede = data.espacios.filter(e => 
            e.ubicacion.toLowerCase().includes(sedeSeleccionada.toLowerCase())
        );

        const total = espaciosSede.length;
        const disponibles = espaciosSede.filter(e => e.estado === 'disponible').length;

        if (total === 0) {
            semaforoEl.className = 'status-circle gray';
            txtDisp.textContent = "Sin Datos";
            txtDet.textContent = "No hay espacios registrados en esta sede.";
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
        console.error(e);
        txtDisp.textContent = "--";
    }
}

// 7. UTILIDAD: OBTENER USUARIO (Para no depender de archivos externos)
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : { nombre: 'Usuario', rol: 2 };
}