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
async function creerConversation(userId) {
    try {

        const monId = window.currentUser?.id || "377a447b-16b0-407d-a4bb-1260fd890ac7";

        const res = await fetch(`${window.CHAT_BASE_URL}/conversations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": window.CHAT_API_KEY,
                "Authorization": `Bearer ${window.CHAT_TOKEN}`,
                "Accept": "application/json"
            },
            body: JSON.stringify({
                type: "private",
                name: "Discussion",
                participantIds: [
                    monId,
                    userId
                ]
            })
        });

        if (!res.ok) {
            console.log(await res.text());
            return null;
        }

        const apiData = await res.json();

        return apiData.data.conversation;

    } catch (err) {
        console.error(err);
        return null;
    }
}
async function chargerMessages(conversationId) {
    try {
        const res = await fetch(`${window.CHAT_BASE_URL}/conversations/${conversationId}/messages`, {
            method: "GET",
            headers: {
                "x-api-key": window.CHAT_API_KEY,
                "Authorization": `Bearer ${window.CHAT_TOKEN}`,
                "Accept": "application/json"
            }
        });
        if (!res.ok) throw new Error("Impossible de charger les messages");
        
        const apiData = await res.json();
        console.log(
        JSON.stringify(apiData.data.messages, null, 2)
        );
        return apiData.data.messages;
    } catch (err) {
        console.error("Erreur chargement messages :", err);
        return [];
    }
}
async function recupererInfosConversation(userId) {
    try {
        const conversation = await verifierConversation(userId);

        if (!conversation) {
            return {
                lastMessage: "",
                lastTime: "",
                unread: 0
            };
        }

        const messages = await chargerMessages(conversation.id);

        if (!messages || messages.length === 0) {
            return {
                lastMessage: "",
                lastTime: "",
                unread: 0
            };
        }

        // Trier du plus récent au plus ancien
        messages.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const dernier = messages[0];

        // Messages non lus
        const unread = messages.filter(msg =>
            String(msg.senderId) !== String(window.currentUser.id) &&
            (
                msg.read === false ||
                msg.isRead === false ||
                msg.seen === false ||
                msg.status === "unread"
            )
        ).length;


        const dateFormatee = formaterDatePourListe(dernier.createdAt);

        return {
            lastMessage: dernier.content,
            lastTime: dateFormatee, // Utilise maintenant la nouvelle fonction
            unread: unread
        };


    } catch (error) {
        console.error(error);

        return {
            lastMessage:"",
            lastTime:"",
            unread:0
        };
    }
}
async function envoyerMessage(conversationId, content) {
    try {
        // 1. Vérification de sécurité
        if (!content || content.trim() === "") {
            console.error("Le message est vide");
            return null;
        }

        console.log("Conversation :", conversationId);
        console.log("Message :", content);

        const res = await fetch(
            `${window.CHAT_BASE_URL}/conversations/${conversationId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": window.CHAT_API_KEY,
                    "Authorization": `Bearer ${window.CHAT_TOKEN}`
                },
                // Utilisation directe du paramètre 'content' au lieu de 'messageText'
                body: JSON.stringify({
                    content: content,
                    conversationId: conversationId
                })
            }
        );

        console.log("Status :", res.status);

        const data = await res.json();

        console.log("Réponse POST /messages :", data);

        if (!res.ok) {
            console.error("Erreur API :", data);
            return null;
        }

        return data;

    } catch (err) {
        console.error("Erreur JS :", err);
        return null;
    }
}
// AJOUTEZ LA FONCTION ICI
function formaterDate(isoDate) {
    if (!isoDate) return "";
    
    const date = new Date(isoDate);
    const today = new Date();
    
    // Comparaison précise (année, mois, jour)
    const estAujourdhui = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    // Si c'est aujourd'hui, on affiche "Today", sinon le format JJ/MM
    let jourStr = estAujourdhui 
        ? "Today" 
        : date.toLocaleDateString('en-US', { weekday: 'long' });
    const jour = jourStr.charAt(0).toUpperCase() + jourStr.slice(1); 
    const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return { jour, heure };
}