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
// AJOUTEZ LA NOUVELLE FONCTION ICI
function formaterDatePourListe(isoDate) {
    if (!isoDate) return "";
    
    const date = new Date(isoDate);
    const now = new Date();
    
    const dateSansHeure = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todaySansHeure = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffEnJours = (todaySansHeure - dateSansHeure) / (1000 * 60 * 60 * 24);

    if (diffEnJours === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffEnJours === 1) {
        return "Yesterday";
    } else if (diffEnJours < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
}
// ==========================================
// MODIFIER UN MESSAGE
// ==========================================
window.modifierMessage = async function(id) {

    console.log("ID modification :", id);

    const message = window.messages.find(msg => msg.id === id);

    if (!message) {
        console.error("Message introuvable");
        return;
    }


    const nouveauTexte = prompt(
        "Modifier le message :",
        message.content
    );


    if (!nouveauTexte || nouveauTexte.trim() === message.content.trim()) {
        return;
    }


    try {

        const response = await fetch(
            `${window.CHAT_BASE_URL}/messages/${id}`,
            {
                method: "PATCH",

                headers: {
                    "Authorization": `Bearer ${window.CHAT_TOKEN}`,
                    "x-api-key": window.CHAT_API_KEY,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    content: nouveauTexte.trim()
                })
            }
        );


        const data = await response.json();

        console.log("Réponse API modification :", data);


        if (!response.ok) {
            throw new Error(data.message || "Modification échouée");
        }


        // Actualiser l'affichage
        const messages = await chargerMessages(message.conversationId);

        afficherMessages(messages);

        // Afficher "(modifié)" après 2 secondes
        afficherModificationApresDelai(id);


    } catch(error) {

        console.error(
            "Erreur modification :",
            error
        );

    }

};
// ==========================================
// AFFICHER "MODIFIÉ" APRÈS 2 SECONDES
// ==========================================
function afficherModificationApresDelai(messageId) {

    setTimeout(() => {

        const messageElement = document.querySelector(
            `[data-message-id="${messageId}"]`
        );

        if (messageElement) {

            const badge = messageElement.querySelector(".message-modifie");

            if (!badge) {

                const span = document.createElement("span");

                span.className = "message-modifie text-[10px] ml-2 text-gray-400";

                span.textContent = "(modifié)";

                messageElement.appendChild(span);

            }

        }

    }, 2000);

}
// ==========================================
// SUPPRIMER UN MESSAGE
// ==========================================
async function supprimerMessage(messageId) {

    if (!confirm("Supprimer ce message ?")) return;

    try {

        const response = await fetch(
            `${window.CHAT_BASE_URL}/messages/${messageId}`,
            {
                method: "DELETE",
                headers: {
                    "x-api-key": window.CHAT_API_KEY,
                    "Authorization": `Bearer ${window.CHAT_TOKEN}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        const messages = await chargerMessages(window.activeConversationId);
        afficherMessages(messages);

    } catch (err) {

        console.error(err);
        alert(err.message);

    }

}

// ==========================================
// EDITER
// ==========================================
function editerMessage(messageId, ancienTexte) {

    const texte = prompt("Modifier le message", ancienTexte);

    if (texte === null) return;

    if (texte.trim() === "") return;

    modifierMessage(messageId, texte);

}
// ==========================================
// 3. AFFICHAGE ET RENDU HTML
// ==========================================
function afficherMessages(messages) {
     window.messages = messages; // AJOUTER CETTE LIGNE
    const container = window.CHAT_MESSAGES_CONTAINER;
    container.innerHTML = "";
    const myId = window.currentUser?.id ;
    let derniereDate = null;

    if (!messages || messages.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 mt-10">Aucun message</div>`;
        return;
    }

    messages.forEach(msg => {
        const estMoi = String(msg.senderId) === String(myId);
        const { jour, heure } = formaterDate(msg.createdAt);
        
        if (jour !== derniereDate) {
            container.innerHTML += `
                <div class="text-center text-[10px] text-slate-400 my-4 font-bold ">
                    ${jour}
                </div>`;
            derniereDate = jour;
        }
        
        const div = document.createElement("div");
        div.dataset.messageId = msg.id;
        // On garde le flex pour aligner tout le bloc message à gauche ou à droite
        div.className = `flex ${estMoi ? "justify-end" : "justify-start"} mb-4`;
        
        // On utilise un conteneur colonne (flex-col) pour empiler la bulle et l'heure
        div.innerHTML = `
            <div class="flex flex-col ${estMoi ? "items-end" : "items-start"} max-w-[70%]">
                <div class="px-4 py-3 rounded-2xl shadow-sm ${
                    estMoi ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                }">
                    <div class="flex items-start gap-2">

    <p class="text-sm flex-1">
        ${msg.content}
    </p>

    ${
        estMoi
        ?
        `
        <div class="relative">

            <button
                class="btn-menu text-xs opacity-70 hover:opacity-100"
                data-id="${msg.id}">
                ⋮
            </button>
            
            <div
                id="menu-${msg.id}"
                class="hidden absolute right-0 top-5 bg-white shadow-lg rounded-lg border w-36 z-50">

                <button
                    class="btn-edit block w-full text-left px-3 py-2 hover:bg-gray-100"
                    data-id="${msg.id}"
                    data-content="${encodeURIComponent(msg.content)}">
                    ✏️ Modifier
                </button>

                <button
                    class="btn-delete block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                    data-id="${msg.id}">
                    🗑 Supprimer
                </button>

            </div>

        </div>
        `
        :
        ""
    }

</div>
                </div>
                <div class="text-[9px] mt-1 text-slate-400 px-1">
                    ${heure}
                </div>
            </div>
        `;
        container.appendChild(div);
        // Bouton Modifier
const btnMenu = div.querySelector(".btn-menu");

if (btnMenu) {

    btnMenu.addEventListener("click", function (e) {

        e.stopPropagation();

        toggleMessageMenu(this.dataset.id);

    });

}
// Bouton Modifier
const btnEdit = div.querySelector(".btn-edit");

if (btnEdit) {

    btnEdit.addEventListener("click", function () {

        const id = this.dataset.id;

        console.log("MODIFIER CLIQUÉ :", id);

        modifierMessage(id);

    });

}
// Bouton Supprimer
const btnDelete = div.querySelector(".btn-delete");

if (btnDelete) {

    btnDelete.addEventListener("click", function () {

        const id = this.dataset.id;

        supprimerMessage(id);

    });

}
    });
    container.scrollTop = container.scrollHeight;
}
function toggleMessageMenu(id) {

    document
        .querySelectorAll("[id^='menu-']")
        .forEach(menu => {

            if (menu.id !== "menu-" + id)
                menu.classList.add("hidden");

        });

    document
        .getElementById("menu-" + id)
        .classList
        .toggle("hidden");

}
function activerChats() {
    document.querySelectorAll(".user-item").forEach(item => {
        item.onclick = async () => {
            const userId = item.dataset.user;
            if (!userId) return;
            // --- AJOUT : Logique Responsive ---
            const sidebar = document.getElementById("sidebar"); // Assurez-vous d'avoir cet ID sur votre section liste
            const mainChat = document.querySelector("main");    // Votre zone de messagerie
            
            if (window.innerWidth < 768) {
                if (sidebar) sidebar.classList.add("hidden");
                if (mainChat) {
                    mainChat.classList.remove("hidden");
                    mainChat.classList.add("flex");
                }
            }
            // ----------------------------------
            console.log("Clic sur l'utilisateur :", userId);

            if (window.CHAT_MESSAGES_CONTAINER) {
                window.CHAT_MESSAGES_CONTAINER.innerHTML = `<div class="text-center text-slate-400 mt-10 text-sm">Ouverture de la conversation...</div>`;
            }

            // 1. On tente une vérification douce
            let conversation = await verifierConversation(userId);
            
            // 2. Si CORS ou inexistante, on fonce directement sur la création/récupération POST
            if (!conversation) {
                conversation = await creerConversation(userId);
            }

            const convId = conversation?.id || conversation?.data?.id || conversation?._id || conversation?.data?._id;

            if (convId) {
                window.activeConversationId = convId;
                console.log("activeConversationId =", window.activeConversationId);
                const messages = await chargerMessages(convId);
                afficherMessages(messages);
                
                const utilisateur = window.CHAT_USERS_DATA.find(
    u => String(u.user.id || u.user._id) === String(userId)
);

if (utilisateur) {
    afficherProfilConversation(utilisateur.user);
}
            } else {
                if (window.CHAT_MESSAGES_CONTAINER) {
                    window.CHAT_MESSAGES_CONTAINER.innerHTML = `
                        <div class="text-center text-red-500 mt-10 text-sm">
                            <p class="font-semibold">Impossible de charger la conversation.</p>
                            <p class="text-xs text-slate-400 mt-1">Veuillez demander aux administrateurs de l'API d'autoriser l'en-tête Authorization dans leur configuration CORS.</p>
                        </div>`;
                }
            }
        };
    });
}
function redessinerListe(listeUtilisateurs) {

    window.CHAT_USERS_LIST = document.getElementById("usersList");

    if (!window.CHAT_USERS_LIST) return;

    window.CHAT_USERS_LIST.innerHTML = "";

    listeUtilisateurs.forEach(item => {
        const user = item.user;
        const displayName = user.fullName || "Utilisateur";

        window.CHAT_USERS_LIST.innerHTML += `
        <div 
        class="user-item px-5 py-4 flex items-center space-x-4 cursor-pointer hover:bg-slate-50 transition-colors"
        data-user="${user.id || user._id}">

            <!-- Avatar seul, sans le div pour le point vert -->
            <div class="relative">
                <img 
                src="${user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}"
                class="h-12 w-12 rounded-full object-cover">
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex justify-between">
                    <h4 class="font-bold text-sm text-slate-800 truncate">
                    ${displayName}
                    </h4>

                    <span class="text-[10px] text-slate-400">
                    ${item.lastTime || ""}
                    </span>
                </div>

                <div class="flex items-center gap-2">
                    <p class="text-xs text-slate-500 truncate max-w-[170px]">
                    ${item.lastMessage || "Aucun message"}
                    </p>

                    ${
                    item.unread > 0
                    ?
                    `
                    <span class="
                    bg-blue-600 
                    text-white 
                    text-[11px]
                    font-bold
                    rounded-full
                    h-5 
                    w-5
                    flex 
                    items-center 
                    justify-center
                    shrink-0">
                    ${item.unread}
                    </span>
                    `
                    :
                    ""
                    }
                </div>
            </div>
        </div>
        `;
    });

    activerChats();
}
async function chargerUtilisateurs() {
    try {
        console.log("Démarrage du chargement des utilisateurs...");
        
        const meResponse = await fetch(`${window.CHAT_BASE_URL}/auth/me`, {
            headers: {
                "x-api-key": window.CHAT_API_KEY,
                "Authorization": `Bearer ${window.CHAT_TOKEN}`
            }
        });
        
        let me = null;
        if (meResponse.ok) {
            const jsonMe = await meResponse.json();
            console.log("Réponse complète /auth/me :", jsonMe);
            me = jsonMe.data?.user||jsonMe.user || jsonMe.data || jsonMe;
            window.currentUser = me;
            const currentUserNameEl = document.getElementById("currentUserName");
            console.log("Données de l'utilisateur reçu (me) :", me);
            const currentUserAvatarEl = document.getElementById("currentUserAvatar");
            if (currentUserNameEl) {
                currentUserNameEl.textContent = me.fullName || "Nom non trouvé";
            }
            if (currentUserAvatarEl) {
                // 1. Assurez-vous que le parent est "relative"
                currentUserAvatarEl.parentElement.classList.add("relative");
                
                // 2. Ajout de la bulle de statut (verte par défaut pour vous)
                // On vérifie si elle existe déjà pour ne pas la dupliquer
                if (!currentUserAvatarEl.parentElement.querySelector('.status-bubble')) {
                    currentUserAvatarEl.insertAdjacentHTML('afterend', `
                        <div class="status-bubble absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                    `);
                }

                currentUserAvatarEl.src = me.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.fullName || 'Dim mbolokala')}`;
                currentUserAvatarEl.classList.remove("hidden");
            }
        }

        const usersResponse = await fetch(`${window.CHAT_BASE_URL}/users`, {
            headers: {
                "x-api-key": window.CHAT_API_KEY,
                "Authorization": `Bearer ${window.CHAT_TOKEN}`
            }
        });

        if (!usersResponse.ok) {
            console.error("Erreur HTTP sur /users :", usersResponse.status);
            redessinerListe([]);
            return;
        }
        if (!window.currentUser) {
            window.currentUser = {
                id: "window.currentUser?.id",
                fullName: "Dim mbolokala"
            };
        }

        const apiData = await usersResponse.json();
        let users = [];
        if (apiData) {
            if (Array.isArray(apiData)) {
                users = apiData;
            } else if (apiData.data) {
                if (Array.isArray(apiData.data)) {
                    users = apiData.data;
                } else if (typeof apiData.data === 'object') {
                    const tableauTrouve = Object.values(apiData.data).find(val => Array.isArray(val));
                    if (tableauTrouve) users = tableauTrouve;
                    else users = Object.values(apiData.data);
                }
            } else if (apiData.users && Array.isArray(apiData.users)) {
                users = apiData.users;
            }
        }

        if (Array.isArray(users)) {
            users = users.filter(u => u && typeof u === 'object' && (u.id || u._id));
        } else {
            users = [];
        }

        const myId = String(me?.id || me?._id || "").trim().toLowerCase();
        const myFullName = String(me?.fullName || "Dim mbolokala").trim().toLowerCase();
        const myUsername = String(me?.username || "").trim().toLowerCase();

        const listeFiltrer = users.filter(u => {
            if (!u) return false;
            const currentId = String(u.id || u._id || "").trim().toLowerCase();
            const currentFullName = String(u.fullName || u.name || "").trim().toLowerCase();
            const currentUsername = String(u.username || "").trim().toLowerCase();

            if ((currentId !== "" && currentId === myId) || 
                (currentFullName !== "" && currentFullName === myFullName) || 
                (currentUsername !== "" && currentUsername === myUsername)) {
                return false; 
            }
            return true;
        });
        
        window.CHAT_USERS_DATA = await Promise.all(
    listeFiltrer.map(async user => {

        const infos = await recupererInfosConversation(
            user.id || user._id
        );

        return {
            user:user,
            convId:null,
            ...infos
        };

    })
);


redessinerListe(window.CHAT_USERS_DATA);

    } catch (err) {
        console.error("Crash dans chargerUtilisateurs :", err);
        redessinerListe([]);
    }
}
function afficherProfilConversation(user) {
console.log(document.getElementById("statusText"));
console.log(document.getElementById("chatUserStatus"));
console.log(document.getElementById("chatUserAvatar"));
    const headerName = document.getElementById("chatUserName");
    const headerAvatar = document.getElementById("chatUserAvatar");
    const headerStatus = document.getElementById("chatUserStatus");

    // Nom
    if (headerName) {
        headerName.textContent = user.fullName;
    }

    // Avatar
    if (headerAvatar) {

        headerAvatar.src =
            user.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.name || "User")}`;

        headerAvatar.classList.remove("hidden");
    }

    // Statut
    const statusText = document.getElementById("statusText");
    const statusDot = document.getElementById("statusDot");

    if (headerStatus) {

        headerStatus.classList.remove("hidden");

        // Votre API ne fournit pas isOnline.
        // On affiche donc Online par défaut.
        statusText.textContent = "Online";
        statusText.style.textTransform = "capitalize";
        statusDot.className =
            "w-2 h-2 rounded-full bg-green-500";
    }
}

// ==========================================
// 4. ÉCOUTEURS D'ÉVÉNEMENTS
// ==========================================
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const emojiBtn = document.getElementById('emoji-btn');
const picker = document.getElementById('emoji-selector');
const fileBtn = document.getElementById('file-upload-btn'); // ID du bouton "+"
const fileInput = document.getElementById('file-input');   // ID de l'input type file masqué
console.log("Bouton trouvé :", fileBtn);
console.log("Input trouvé :", fileInput);
// --- Logique Émojis ---
if (picker) {
    emojiBtn.addEventListener('click', () => {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    });

    picker.addEventListener('emoji-click', event => {
        input.value += event.detail.unicode;
        picker.style.display = 'none';
        input.focus();
    });
}

// --- Logique Fichiers (Photos/Vidéos) ---
if (fileBtn) {
    fileBtn.addEventListener('click', () => {
        fileInput.click(); // Ouvre la sélection de fichiers
    });
}

if (fileInput) {
    fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Fichier prêt à être envoyé :", file.name);

    // 1. Appeler la fonction qui envoie réellement le fichier au serveur
    // Vous devez avoir cette fonction définie dans votre projet
    const message = await envoyerFichier(window.activeConversationId, file);

    // 2. Si l'envoi réussit, rafraîchir la liste des messages
    if (message) {
        const messages = await chargerMessages(window.activeConversationId);
        afficherMessages(messages);
    }
    
    // 3. Réinitialiser l'input pour pouvoir renvoyer le même fichier si besoin
    fileInput.value = "";
    });
}
// Fonction unifiée pour envoyer le message
async function handleSend() {
    const content = input.value.trim();
    if (!content || !window.activeConversationId) return;

    console.log("Envoi du message :", content);

    const message = await envoyerMessage(window.activeConversationId, content);

    if (message) {
        const messages = await chargerMessages(window.activeConversationId);
        afficherMessages(messages);
        input.value = ""; // Vider l'input après l'envoi
    }
}

// Envoi avec la touche Entrée
input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        await handleSend();
    }
});

// Envoi avec le clic sur la flèche bleue
if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
        await handleSend();
    });
}
// Exemple de logique à ajouter là où vous gérez le clic sur un utilisateur
function openChat(userId) {
    const section = document.querySelector('section'); // Liste contacts
    const main = document.querySelector('main');       // Zone messages

    // Sur mobile (largeur < 768px)
    if (window.innerWidth < 768) {
        section.classList.add('hidden'); // Masquer la liste
        main.classList.remove('hidden'); // Afficher les messages
        main.classList.add('flex');      // Assurer le display flex
    }
    
    // Charger vos messages ici...
}
// ==========================================
// 5. NAV LATÉRALE INTERACTIVE
// ==========================================
function activerNavigationLaterale() {
    const navItems = [...document.querySelectorAll("aside nav > div"), document.querySelector("aside > div.mt-auto")];
    navItems.forEach(item => {
        if (!item) return;
        item.addEventListener("click", () => {
            navItems.forEach(el => {
                if (!el) return;
                el.className = "text-slate-400 hover:text-blue-600 cursor-pointer transition-colors p-3 rounded-xl";
            });
            item.className = "p-3 bg-blue-50 text-blue-600 rounded-xl cursor-pointer transition-all";
        });
    });
}
document.addEventListener("DOMContentLoaded", () => {
    chargerUtilisateurs();
    activerNavigationLaterale();
    // Mise à jour automatique toutes les minutes
    setInterval(() => {
        chargerUtilisateurs();
    }, 20000);
});
document.addEventListener("click", function(e){

    if(!e.target.closest(".relative")){

        document
        .querySelectorAll("[id^='menu-']")
        .forEach(menu=>menu.classList.add("hidden"));

    }

});
// ==========================================
// 6. GESTION DU BOUTON RETOUR (MOBILE)
// ==========================================
const backBtn = document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", () => {
        const sidebar = document.getElementById("sidebar");
        const mainChat = document.querySelector("main");

        // On réaffiche la liste et on cache le chat
        if (sidebar) sidebar.classList.remove("hidden");
        if (mainChat) {
            mainChat.classList.add("hidden");
            mainChat.classList.remove("flex");
        }
    });
}