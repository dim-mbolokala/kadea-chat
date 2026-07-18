document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const messageBox = document.getElementById("message");
    const togglePassword = document.getElementById("togglePassword");

    // METTEZ VOTRE CLÉ DE WORKSPACE ICI
    const WORKSPACE_API_KEY = "wksp_3814f2f67db2d466bc8d60c468d59ab5"; 

    if (!form || !emailInput || !passwordInput) {
        console.error("Erreur : Éléments HTML introuvables.");
        return; 
    }

    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            return showError("Veuillez remplir tous les champs");
        }

        if (!validateEmail(email)) {
            return showError("Email invalide");
        }

        try {
            // Modification de l'URL (/auth/login) et ajout des Headers requis
            const response = await fetch("https://kadea-chat-api.onrender.com/auth/login", { 
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-api-key": WORKSPACE_API_KEY // Requis par l'API Kadea
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            // Si l'API renvoie success: false, on affiche son message d'erreur
            if (!response.ok || result.success === false) {
                return showError(result.message || "Erreur de connexion");
            }

            // D'après la structure de succès { success: true, data: { ... } }
            if (!result.data || !result.data.token) {
                return showError("Utilisateur non authentifié (Token manquant)");
            }

            // On stocke le token JWT pour les prochaines requêtes
            localStorage.setItem("token", result.data.token);
            
            // Redirection vers l'interface de chat
            window.location.href = "profil.html"; 

        } catch (error) {
            console.error(error);
            showError("Erreur réseau ou serveur injoignable");
        }
    });

    function showError(message) {
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.classList.remove("hidden");
            messageBox.classList.add("text-red-500");
        } else {
            alert(message);
        }
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});