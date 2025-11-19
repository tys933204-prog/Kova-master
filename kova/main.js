// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Load chat history and preferences
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {
    name: "",
    favoriteStyles: [],
    favoriteBrands: [],
    budget: "",
    favoriteColors: [],
    previousContext: []
};

// This array will track the full session conversation for memory
let sessionConversation = [...chatHistory];

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

        // Update chat history and session memory
        chatHistory.push({ sender, text });
        sessionConversation.push({ sender, text });
        sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // OpenAI API call
    async function sendToOpenAI(messagesArray) {
        const apiMessages = [
            { role: "system", content: "You are Kova, an AI fashion assistant. Speak with confidence, style, and warmth." },
            ...messagesArray.map(m => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text
            }))
        ];

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("kova_api")}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                messages: apiMessages
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "⚠️ Something went wrong.";
    }

    // Kova reply with session memory and rare name usage
    async function kovaReply(userMessage) {
        loading.style.display = "block";

        // Add user message to memory
        sessionConversation.push({ sender: "user", text: userMessage });
        userPreferences.previousContext.push(userMessage);

        // Call OpenAI with full conversation
        const reply = await sendToOpenAI(sessionConversation);

        loading.style.display = "none";

        // Rarely prepend user name (2–3% chance)
        let finalReply = reply;
        if (userPreferences.name && Math.random() < 0.03) {
            finalReply = `${userPreferences.name}, ${reply}`;
        }

        addMessage(finalReply, "kova");

        // Store Kova's reply in session memory and preferences
        sessionConversation.push({ sender: "kova", text: finalReply });
        userPreferences.previousContext.push(finalReply);

        // Parse userMessage for quick preference updates
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

    // Enter key triggers send
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendBtn.click();
    });

    // Load saved chat history
    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
