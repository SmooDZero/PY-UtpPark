// Chatbot functionality
const chatbotModal = document.getElementById('chatbotModal');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendChatbotBtn = document.getElementById('sendChatbotMessage');
const closeChatbotBtn = document.getElementById('closeChatbot');

// Asegurar que el modal esté oculto al cargar y cuando se carga la página
if (chatbotModal) {
  chatbotModal.classList.add('hidden');
}

// Asegurar que el modal esté oculto cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  if (chatbotModal) {
    chatbotModal.classList.add('hidden');
  }
});

// Función para cerrar chatbot
function closeChatbot() {
  if (chatbotModal) {
    chatbotModal.classList.add('hidden');
  }
}

// Abrir chatbot (función global)
window.openChatbot = function() {
  const modal = document.getElementById('chatbotModal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('chatbotInput');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
    // Cargar historial si la función existe
    if (typeof loadChatbotHistory === 'function') {
      loadChatbotHistory();
    }
  } else {
    console.error('No se encontró el modal del chatbot');
  }
};

// Cerrar chatbot con botón X
if (closeChatbotBtn) {
  closeChatbotBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeChatbot();
  });
}

// Cerrar chatbot haciendo clic fuera del modal
if (chatbotModal) {
  chatbotModal.addEventListener('click', (e) => {
    // Si se hace clic en el fondo del modal (no en el contenido)
    if (e.target === chatbotModal) {
      closeChatbot();
    }
  });
}

// Cerrar chatbot con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatbotModal && !chatbotModal.classList.contains('hidden')) {
    closeChatbot();
  }
});

// Enviar mensaje
if (sendChatbotBtn) {
  sendChatbotBtn.addEventListener('click', sendMessage);
}

if (chatbotInput) {
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

async function sendMessage() {
  const pregunta = chatbotInput.value.trim();
  
  if (!pregunta) return;

  // Agregar pregunta del usuario
  addMessage(pregunta, 'user');
  chatbotInput.value = '';

  // Mostrar indicador de carga
  const loadingId = addMessage('Pensando...', 'bot', true);

  try {
    const response = await authenticatedFetch('/chatbot/pregunta', {
      method: 'POST',
      body: JSON.stringify({ pregunta })
    });

    if (!response) return;

    const data = await response.json();

    // Remover indicador de carga
    const loadingMsg = document.getElementById(loadingId);
    if (loadingMsg) loadingMsg.remove();

    // Agregar respuesta
    addMessage(data.respuesta, 'bot');
  } catch (error) {
    const loadingMsg = document.getElementById(loadingId);
    if (loadingMsg) loadingMsg.remove();
    
    addMessage('Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta nuevamente.', 'bot');
  }
}

function addMessage(text, type, isLoading = false) {
  const messageDiv = document.createElement('div');
  const messageId = 'msg-' + Date.now();
  messageDiv.id = messageId;
  messageDiv.className = `chatbot-message ${type}`;
  
  if (isLoading) {
    messageDiv.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> ${text}</p>`;
  } else {
    messageDiv.innerHTML = `<p>${text}</p>`;
  }

  chatbotMessages.appendChild(messageDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

  return messageId;
}

async function loadChatbotHistory() {
  try {
    const response = await authenticatedFetch('/chatbot/historial');
    if (!response) return;

    const historial = await response.json();
    
    // Limpiar mensajes (excepto el mensaje de bienvenida)
    const welcomeMsg = chatbotMessages.querySelector('.bot');
    chatbotMessages.innerHTML = '';
    if (welcomeMsg) {
      chatbotMessages.appendChild(welcomeMsg);
    }

    // Agregar historial (máximo 5 mensajes recientes)
    historial.slice(0, 5).reverse().forEach(item => {
      addMessage(item.pregunta, 'user');
      addMessage(item.respuesta, 'bot');
    });
  } catch (error) {
    console.error('Error al cargar historial:', error);
  }
}

// Importar funciones necesarias
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

