const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) {
        localStorage.setItem("kova_api", key);
        alert("Key saved! Refresh the page.");
    }
}
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startChat");
    const chatContainer = document.getElementById("chatContainer");
    const sendBtn = document.getElementById("sendBtn");
    const inputField = document.getElementById("userInput");
    const chatBox = document.getElementById("messages");
    const loading = document.getElementById("loading");
    const usernameInput = document.getElementById("usernameInput");
let username = sessionStorage.getItem("kova_username") || "";
usernameInput.value = username;

usernameInput.addEventListener("change", () => {
    username = usernameInput.value.trim();
    sessionStorage.setItem("kova_username", username);
});
    startBtn.addEventListener("click", () => {
        chatContainer.style.display = "block";
        startBtn.style.display = "none";
    });
    let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {};

    function addMessage(text, sender) {
        const message = document.createElement("div");
        message.classList.add("message", sender);
        message.style.margin = "8px 0";
        message.textContent = text;
        chatBox.appendChild(message);
        chatHistory.push({ sender, text });
sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendToOpenAI(message) {
        const reply = await sendToOpenAI(`${username ? username + ': ' : ''}${userMessage}`);
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

    async function kovaReply(userMessage) {
    loading.style.display = "block";      // Show loading
    const personalizedMessage = userPreferences.lastStyle 
    ? `Last style mentioned: ${userPreferences.lastStyle}. Current message: ${userMessage}` 
    : userMessage;

const reply = await sendToOpenAI(personalizedMessage);
    loading.style.display = "none";       // Hide loading
    addMessage(reply, "kova");
        // Example: store last style mentioned
if (userMessage.toLowerCase().includes("style")) {
    userPreferences.lastStyle = userMessage;
    localStorage.setItem("kova_preferences", JSON.stringify(userPreferences));
}
}

    sendBtn.addEventListener("click", () => {
        const message = inputField.value.trim();
        if (!message) return;
        addMessage(message, "user");
        inputField.value = "";
        kovaReply(message);
    });

    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendBtn.click();
        }
    });
});
// Load saved chat messages on page load
chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
