// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Load chat history and preferences
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
// Phase 2A: initialize user preferences
let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {
    favoriteStyles: [],
    favoriteBrands: [],
    budget: "",
    favoriteColors: [],
    previousContext: []
};

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startChat");
    const chatContainer = document.getElementById("chatContainer");
    const sendBtn = document.getElementById("sendBtn");
    const inputField = document.getElementById("userInput");
    const chatBox = document.getElementById("messages");
    const loading = document.getElementById("loading");

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

    // Kova reply with session memory
    async function kovaReply(userMessage) {
        loading.style.display = "block";

        // Add user message to preferences context immediately
        userPreferences.previousContext.push(userMessage);

        // Build personalized prompt for Kova including saved preferences
        let contextMessage = `Preferences: 
Styles: ${userPreferences.favoriteStyles.join(", ") || "none"}, 
Brands: ${userPreferences.favoriteBrands.join(", ") || "none"}, 
Budget: ${userPreferences.budget || "none"}, 
Colors: ${userPreferences.favoriteColors.join(", ") || "none"}.
Conversation so far: ${userPreferences.previousContext.join(" | ")}`;

        const replyMessage = `User says: ${userMessage}\n${contextMessage}`;

        // Simulate typing delay
        await new Promise(r => setTimeout(r, 1500));

        const reply = await sendToOpenAI(replyMessage);
        loading.style.display = "none";
        addMessage(reply, "kova");

        // Optional: update preferences from userMessage keywords
        const msgLower = userMessage.toLowerCase();
        if (msgLower.includes("style:")) {
            const style = msgLower.split("style:")[1].trim();
            if (!userPreferences.favoriteStyles.includes(style)) userPreferences.favoriteStyles.push(style);
        }
        if (msgLower.includes("brand:")) {
            const brand = msgLower.split("brand:")[1].trim();
            if (!userPreferences.favoriteBrands.includes(brand)) userPreferences.favoriteBrands.push(brand);
        }
        if (msgLower.includes("color:")) {
            const color = msgLower.split("color:")[1].trim();
            if (!userPreferences.favoriteColors.includes(color)) userPreferences.favoriteColors.push(color);
        }
        if (msgLower.includes("budget:")) {
            const budget = msgLower.split("budget:")[1].trim();
            userPreferences.budget = budget;
        }

        // Save preferences immediately
        localStorage.setItem("kova_preferences", JSON.stringify(userPreferences));
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
