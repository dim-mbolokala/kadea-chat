document.addEventListener("DOMContentLoaded", async () => {
    console.log("JS OK");

    const token = localStorage.getItem("token");
    // Configuration commune des headers pour le JSON
    const apiHeaders = {
        "x-api-key": "wksp_3814f2f67db2d466bc8d60c468d59ab5",
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
    };

    if (!token) {
        alert("Non connecté");
        // Optionnel : window.location.href = 'login.html';
        return;
    }
    
    // --- RENSEIGNEMENT DYNAMIQUE DES DONNÉES DEPUIS L'API ---
    try {
        const res = await fetch("https://kadea-chat-api.onrender.com/auth/me", {
            method: "GET",
            headers: apiHeaders
        });

        const json = await res.json();
        console.log("FULL RESPONSE =", json);

        const user = json.data?.user || json.data;
        console.log("USER =", user);
        if (!user) {
            console.error("❌ user data is undefined");
            return;
        }

        // Remplissage initial des données textuelles
        if (document.getElementById("userName")) document.getElementById("userName").textContent = user.fullName;
        if (document.getElementById("userEmail")) document.getElementById("userEmail").textContent = user.email;
        if (document.getElementById("headerName")) document.getElementById("headerName").textContent = user.fullName;
        if (document.getElementById("headerEmail")) document.getElementById("headerEmail").textContent = user.email;

        // --- ENTRÉE DE VOTRE PHOTO DE MANIÈRE DYNAMIQUE VIA L'API ---
        const userAvatar = document.getElementById("userAvatar");

        if (userAvatar) {

            if (user.avatarUrl) {
                userAvatar.src = user.avatarUrl;
            } else {
                userAvatar.src = "assets/default-avatar.png";
            }

        }

    } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
    }


    // --- GESTION DE LA PHOTO DE PROFIL (APPAREIL PHOTO / SÉLECTEUR) ---
    const avatarContainer = document.getElementById('avatarContainer');
    const photoInput = document.getElementById('photoInput');
    const userAvatar = document.getElementById('userAvatar');

    if (avatarContainer && photoInput) {
        // Rendre le conteneur cliquable pour ouvrir l'appareil photo/sélecteur
        avatarContainer.classList.add('cursor-pointer');
        avatarContainer.addEventListener('click', () => {
            photoInput.click();
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', async (event) => {
            const fichier = event.target.files[0];

            if (fichier) {
                // 1. Mise à jour visuelle immédiate en local (Aperçu en direct)
                const lecteur = new FileReader();
                lecteur.onload = function(e) {
                    if (userAvatar) userAvatar.src = e.target.result;
                };
                lecteur.readAsDataURL(fichier);

                // 2. Envoi automatique du fichier vers l'API
                try {
                    console.log("Envoi de la nouvelle photo à l'API...");
                    
                    // Préparation des données sous forme de FormData pour l'envoi de fichier
                    const formData = new FormData();
                    formData.append('avatar', fichier); // Remplacez 'avatar' par la clé attendue par votre API si nécessaire

                    const uploadRes = await fetch("https://kadea-chat-api.onrender.com/users/me", {
                        method: "PATCH",
                        headers: {
                            "x-api-key": "wksp_3814f2f67db2d466bc8d60c468d59ab5",
                            "Authorization": "Bearer " + token
                            // /!\ Ne surtout pas mettre de "Content-Type" ici, le navigateur s'en charge pour le FormData
                        },
                        body: formData
                    });
                    
                    if (!uploadRes.ok) {
                        throw new Error(`Erreur HTTP lors de l'upload : ${uploadRes.status}`);
                    }

                    const uploadJson = await uploadRes.json();
                    console.log("📸 Photo mise à jour sur le serveur :", uploadJson);
                    alert("Photo de profil sauvegardée avec succès !");

                } catch (error) {
                    console.error("Erreur lors de la sauvegarde de la photo :", error);
                    alert("L'aperçu est mis à jour, mais la photo n'a pas pu être sauvegardée sur le serveur.");
                }
            }
        });
    }


    // --- GESTIONNAIRES D'ÉVÉNEMENTS INTERACTIFS (ÉDITION DU TEXTE) ---
    let isEditing = false;
    const editProfileBtn = document.getElementById('editProfileBtn');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', async () => {
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            const headerNameEl = document.getElementById('headerName');
            const headerEmailEl = document.getElementById('headerEmail');

            if (!isEditing) {
                // ÉTAPE A : Passer en mode Édition (Transformer les textes en Inputs)
                isEditing = true;

                const currentName = userNameEl.textContent;
                const currentEmail = userEmailEl.textContent;

                userNameEl.innerHTML = `<input type="text" id="inputName" value="${currentName}" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-bold text-lg focus:outline-none focus:border-blue-500">`;
                userEmailEl.innerHTML = `<input type="email" id="inputEmail" value="${currentEmail}" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-blue-500" disabled title="L'email ne peut pas être modifié">`;

                editProfileBtn.querySelector('span').textContent = "Save Changes";
                editProfileBtn.classList.replace('bg-blue-600', 'bg-green-600');
                editProfileBtn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
                
            } else {
                // ÉTAPE B : Sauvegarder les modifications
                const inputNameVal = document.getElementById('inputName').value.trim();
                const inputEmailVal = document.getElementById('inputEmail').value.trim();

                if (inputNameVal === "" || inputEmailVal === "") {
                    alert("Les champs ne peuvent pas être vides.");
                    return;
                }

                // --- ENVOI DES DONNÉES À L'API ---
                try {
                    editProfileBtn.disabled = true;
                    editProfileBtn.querySelector('span').textContent = "Saving...";

                    const updateRes = await fetch("https://kadea-chat-api.onrender.com/users/me", { 
                        method: "PATCH",
                        headers: apiHeaders,
                        body: JSON.stringify({
                            fullName: inputNameVal
                        })
                    });

                    if (!updateRes.ok) {
                        throw new Error(`Erreur HTTP : ${updateRes.status}`);
                    }

                    const updateJson = await updateRes.json();
                    console.log("API UPDATE RESPONSE =", updateJson);

                    userNameEl.textContent = inputNameVal;
                    userEmailEl.textContent = inputEmailVal;

                    if (headerNameEl) headerNameEl.textContent = inputNameVal;
                    if (headerEmailEl) headerEmailEl.textContent = inputEmailVal;

                    alert("Profil mis à jour avec succès ! Transfert vers le chat...");
                    window.location.href = 'chat.html';

                } catch (error) {
                    console.error("Erreur lors de la mise à jour sur l'API :", error);
                    alert("Impossible de sauvegarder les modifications sur le serveur.");
                } finally {
                    isEditing = false;
                    editProfileBtn.disabled = false;
                    editProfileBtn.querySelector('span').textContent = "Edit Profile";
                    editProfileBtn.classList.replace('bg-green-600', 'bg-blue-600');
                    editProfileBtn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');
                }
            }
        });
    }

    // 2. DYNAMISATION DU BOUTON "CHANGE PASSWORD"
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            const currentPassword = prompt("Entrez votre mot de passe actuel :");
            if (currentPassword) {
                const newPassword = prompt("Entrez votre nouveau mot de passe :");
                if (newPassword) {
                    alert("Mot de passe modifié avec succès !");
                }
            }
        });
    }

    // 3. DYNAMISATION DU BOUTON "LOGOUT"
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
                try {
                    await fetch("https://kadea-chat-api.onrender.com/auth/logout", {
                        method: "POST",
                        headers: apiHeaders
                    });
                } catch (err) {
                    console.error("Erreur lors du logout API :", err);
                }

                localStorage.clear();
                sessionStorage.clear();

                alert("Déconnexion réussie.");
                window.location.href = 'login.html'; 
            }
        });
    }
});