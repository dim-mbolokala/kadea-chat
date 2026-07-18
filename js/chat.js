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
// ==========================================
// 2. FONCTIONS DE REQUÊTES API
// ==========================================
async function verifierConversation(userId) {
    try {
        const res = await fetch(`${window.CHAT_BASE_URL}/conversations`, {
            method: "GET",
            headers: {
                "x-api-key": window.CHAT_API_KEY,
                "Authorization": `Bearer ${window.CHAT_TOKEN}`,
                "Accept": "application/json"
            }
        });
        
        if (!res.ok) return null;
        
        const apiData = await res.json();
        console.log(
    "Réponse GET /conversations :",
    JSON.stringify(apiData, null, 2)
);
        const conversations = apiData.data?.conversations || [];
        
        if (Array.isArray(conversations)) {
            const convExistante = conversations.find(c =>
                c.type === "private" &&
                Array.isArray(c.participants) &&
                c.participants.some(p => p.userId === userId)
            );;
            return convExistante || null;
        }
        return null;
    } catch (err) {
        console.warn("Erreur ou blocage CORS sur la vérification :", err);
        return null; // Retourne null pour forcer la tentative de création directe
    }
}