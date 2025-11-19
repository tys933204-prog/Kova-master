// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Load chat history and preferences
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {};
if (!userPreferences.favoriteBrands) userPreferences.favoriteBrands = [];

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startChat");
    const chatContainer = document.getElementById("chatContainer");
    const sendBtn = document.getElementById("sendBtn");
    const inputField = document.getElementById("userInput");
    const chatBox = document.getElementById("messages");
    const loading = document.getElementById("loading");
    const usernameInput = document.getElementById("usernameInput");
let username = sessionStorage.getItem("kova_username") || "";
if (usernameInput) usernameInput.value = username;

// Save username on change
if (usernameInput) {
    usernameInput.addEventListener("change", () => {
        username = usernameInput.value.trim();
        sessionStorage.setItem("kova_username", username);
    });

    // Save username on Enter key
    usernameInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            username = usernameInput.value.trim();
            sessionStorage.setItem("kova_username", username);
            alert(`Username set to "${username}"`);
        }
    });
}

    // Start chat button
    startBtn.addEventListener("click", () => {
        chatContainer.style.display = "block";
        startBtn.style.display = "none";
    });

    // Add message function
    function addMessage(text, sender) {
        const message = document.createElement("div");
        message.classList.add("message", sender);
        message.textContent = text;
        chatBox.appendChild(message);

        chatHistory.push({ sender, text });
        sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // OpenAI API call
    async function sendToOpenAI(message) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("kova_api")}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                messages: [
                    { role: "system", content: "You are Kova, an AI fashion assistant. Speak with confidence, style, and warmth." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "⚠️ Something went wrong.";
    }

    // Kova reply with typing
    async function kovaReply(userMessage) {
        loading.style.display = "block";
        const personalizedMessage = userPreferences.lastStyle
            ? `Last style mentioned: ${userPreferences.lastStyle}. Current message: ${userMessage}`
            : userMessage;

        // Simulate typing delay
        await new Promise(r => setTimeout(r, 1500));

        const messageForKova = username 
    ? `${username}: ${personalizedMessage}` 
    : personalizedMessage;

const reply = await sendToOpenAI(messageForKova);
        loading.style.display = "none";
        addMessage(reply, "kova");

        // Save last style
        if (userMessage.toLowerCase().includes("style")) {
            userPreferences.lastStyle = userMessage;
            localStorage.setItem("kova_preferences", JSON.stringify(userPreferences));
        }
    }

    // Send button
    sendBtn.addEventListener("click", () => {
        const message = inputField.value.trim();
        if (!message) return;
        addMessage(message, "user");
        inputField.value = "";
        kovaReply(message);
    });

    // Enter key
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendBtn.click();
    });

    // Load chat history
    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
