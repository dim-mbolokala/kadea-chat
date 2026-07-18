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