// ===========================================
// chat.js - Lógica del chat de Lexi
// LAIA Solutions - Demo para clínicas estéticas
// ===========================================
// ===========================================
// Variables globales
// ===========================================

// Array que guarda toda la conversación en formato OpenAI
// El primer elemento siempre es el system prompt
let conversationHistory = [];
// Referencias a elementos del DOM
let messageInput;
let sendButton;
let messagesContainer;
// ===========================================
// Inicialización al cargar la página
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del DOM
    messageInput = document.getElementById('messageInput');
    sendButton = document.getElementById('sendButton');
    messagesContainer = document.getElementById('messages');
    
    // Configurar event listener del botón de enviar
    sendButton.addEventListener('click', handleSendMessage);
    
    // Configurar event listener del textarea
    // Enter envía el mensaje, Shift+Enter agrega salto de línea
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Auto-resize del textarea según contenido
    messageInput.addEventListener('input', function() {
        autoResizeTextarea(messageInput);
    });
});

// ===========================================
// Funciones principales
// ===========================================

// Maneja el envío de mensaje cuando el usuario presiona enviar
async function handleSendMessage() {
    const messageText = messageInput.value.trim();
    
    // Validar que el mensaje no esté vacío
    if (messageText === '') return;
    
    // Limpiar el input y resetear su altura
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Mostrar el mensaje del usuario en la pantalla
    addMessageToUI(messageText, 'user');
    
    // Agregar el mensaje al historial de la conversación
    conversationHistory.push({ role: 'user', content: messageText });
    
    // Mostrar el indicador de "escribiendo..."
    showTypingIndicator();
    
    try {
        // Hacer la llamada a la API
        const reply = await sendToAPI();
        
        // Quitar el indicador de "escribiendo..."
        hideTypingIndicator();
        
        // Mostrar la respuesta del agente
        addMessageToUI(reply, 'bot');
        
        // Agregar la respuesta al historial
        conversationHistory.push({ role: 'assistant', content: reply });
        
        // Limitar el historial para no usar tokens excesivos
        trimConversationHistory();
        
    } catch (error) {
        // Si hay error, mostrar mensaje de fallback
        hideTypingIndicator();
        addMessageToUI('Disculpe, tuve un problema técnico. ¿Puede intentar de nuevo?', 'bot');
        console.error('Error al llamar a la API:', error);
    }
}

// Agrega un mensaje a la interfaz visual
function addMessageToUI(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'user' ? 'message-user' : 'message-bot';
    messageDiv.textContent = text;
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll automático al final
    scrollToBottom();
}

// Hace la llamada al endpoint /api/chat
async function sendToAPI() {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: conversationHistory })
    });
    
    if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`);
    }
    
    const data = await response.json();
    return data.reply;
}

// Muestra el indicador de "escribiendo..."
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator message-bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

// Oculta el indicador de "escribiendo..."
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Hace scroll automático al final del área de mensajes
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Ajusta el tamaño del textarea según contenido (máximo 3 líneas)
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = 80;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + 'px';
}

// Limita el historial de conversación a las últimas 25 interacciones
// (mantiene siempre el system prompt como primer elemento)
function trimConversationHistory() {
    const MAX_MESSAGES = 25;
    
    if (conversationHistory.length > MAX_MESSAGES + 1) {
        const systemPrompt = conversationHistory[0];
        const recentMessages = conversationHistory.slice(-MAX_MESSAGES);
        conversationHistory = [systemPrompt, ...recentMessages];
    }
}