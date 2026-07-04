let password = "";
let passwordFailCounter = 0;

const whitelistUsersElement = document.getElementById("whitelistUsers");
const whitelistEmptyStateElement = document.getElementById("whitelistEmptyState");

/**
 * Validates the password entered when first a user first enters the site
 */
async function validatePassword() {
    if (passwordFailCounter >= 5) {
        window.location.href = "https://minecraft.net";
        return;
    }

    password = prompt("Password");

    if (password !== "") {
        const validation = await fetch("api/validate", {
            method: "POST",
            headers: {
                "X-Api-Key": password,
            }
        });

        const response = await validation.json();
        if (response.success !== true) {
            passwordFailCounter++;
            alert("Wrong password");
            await validatePassword();
            return;
        }

        await refreshWhitelistUsers();
    }
}

/**
 * Function to handle form submission
 * @param {Event} e 
 * @returns void
 */
async function whitelistUser(e) {
    e.preventDefault();

    const form = document.getElementById("whitelistForm");
    const formData = new FormData(form);

    const username = formData.get("username");
    if (username === undefined || username === "") {
        alert("Please enter a valid username");
        return false;
    }

    if (!validateUsername(username)) {
        alert("Please enter a valid username");
        return false;
    }

    try {
        const request = await fetch(
            "api/whitelist/add",
            {
                method: "POST",
                body: JSON.stringify({
                    username
                }),
                headers: {
                    "X-Api-Key": password,
                    "Content-Type": "application/json",
                },
            },
        );

        const response = await request.json();
    
        if (response.success !== true) {
            alert(response.message);
            return false;
        }

        alert(response.message);
        form.reset();
        await refreshWhitelistUsers();
    } catch (err) {
        console.log(`Error ${err.message}`);
        alert("There was an error adding to the whitelist");
    }
    
}

/**
 * Validates if the username is invalid by splitting by string
 * @param {string} username 
 * @returns 
 */
function validateUsername(username) {
    return username.split(" ").length === 1;
}

/**
 * Requests currently whitelisted users and updates the page list
 * @returns {Promise<void>}
 */
async function refreshWhitelistUsers() {
    try {
        const request = await fetch("api/whitelist/list", {
            method: "GET",
            headers: {
                "X-Api-Key": password,
            },
        });

        const response = await request.json();
        if (response.success !== true) {
            whitelistUsersElement.innerHTML = "";
            whitelistEmptyStateElement.textContent = "Could not load whitelist users.";
            return;
        }

        const users = response.data.users;
        renderWhitelistUsers(users);
    } catch (err) {
        console.log(`Error ${err.message}`);
        whitelistUsersElement.innerHTML = "";
        whitelistEmptyStateElement.textContent = "Could not load whitelist users.";
    }
}

/**
 * Renders whitelisted users and attaches remove handlers
 * @param {string[]} users
 * @returns {void}
 */
function renderWhitelistUsers(users) {
    whitelistUsersElement.innerHTML = "";

    if (!Array.isArray(users) || users.length === 0) {
        whitelistEmptyStateElement.textContent = "No users are currently whitelisted.";
        return;
    }

    whitelistEmptyStateElement.textContent = "";

    users.forEach((user) => {
        const listItem = document.createElement("li");
        const usernameSpan = document.createElement("span");
        usernameSpan.textContent = user + " ";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", async () => {
            await removeWhitelistedUser(user);
        });

        listItem.appendChild(usernameSpan);
        listItem.appendChild(removeButton);
        whitelistUsersElement.appendChild(listItem);
    });
}

/**
 * Removes a username from the whitelist via API and refreshes the user list
 * @param {string} username
 * @returns {Promise<void>}
 */
async function removeWhitelistedUser(username) {
    try {
        const request = await fetch("api/whitelist/remove", {
            method: "POST",
            body: JSON.stringify({
                username,
            }),
            headers: {
                "X-Api-Key": password,
                "Content-Type": "application/json",
            },
        });

        const response = await request.json();
        if (response.success !== true) {
            alert(response.message);
            return;
        }

        await refreshWhitelistUsers();
    } catch (err) {
        console.log(`Error ${err.message}`);
        alert("There was an error removing from the whitelist");
    }
}

// Entrypoint
validatePassword();