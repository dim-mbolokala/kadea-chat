const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Récupération des valeurs
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Réinitialiser le message
    message.textContent = "";
    message.className = "text-center mt-4 text-sm font-medium";

    // Validation des champs
    if (!fullName || !email || !password || !confirmPassword) {
        message.textContent = "Veuillez remplir tous les champs.";
        message.classList.add("text-red-600");
        return;
    }

    // Vérification du mot de passe
    if (password !== confirmPassword) {
        message.textContent = "Les mots de passe ne correspondent pas.";
        message.classList.add("text-red-600");
        return;
    }

    const user = {
        fullName,
        email,
        password
    };

    try {

        const result = await registerUser(user);

        if (result.success) {

            message.textContent = result.message;
            message.classList.add("text-green-600");

            // Redirection après 2 secondes
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);

        } else {

            message.textContent = result.message;
            message.classList.add("text-red-600");

        }

    } catch (error) {

        console.error(error);

        message.textContent = "Une erreur est survenue. Vérifiez votre connexion internet.";
        message.classList.add("text-red-600");

    }

});