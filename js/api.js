async function registerUser(user) {

    const response = await fetch(`${BASE_URL}/auth/register`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "x-api-key": "wksp_3814f2f67db2d466bc8d60c468d59ab5"
        },

        body: JSON.stringify(user)

    });

    return await response.json();
}