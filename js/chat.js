// ==========================================
// 1. CONFIGURATION (SANS CONST GLOBALE)
// ==========================================
window.CHAT_TOKEN = localStorage.getItem("token");
window.CHAT_USERS_LIST = document.getElementById("usersList");
window.CHAT_MESSAGES_CONTAINER = document.getElementById("messagesContainer");

if (typeof window.CHAT_API_KEY === 'undefined') {
    window.CHAT_API_KEY = "wksp_3814f2f67db2d466bc8d60c468d59ab5";
}
if (typeof window.CHAT_BASE_URL === 'undefined') {
    window.CHAT_BASE_URL = "https://kadea-chat-api.onrender.com";
}

// Cache local pour la recherche
window.CHAT_USERS_DATA = [];