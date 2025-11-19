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

// Track full session conversation for memory
let sessionConversation = [...chatHistory];

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startChat");
    const chatContainer = document.getElementById("chatContainer");
    const sendBtn = document.getElementById("sendBtn");
    const inputField = document.getElementById("userInput");
    const chatBox = document.getElementById("messages");
    const loading = document.getElementById("loading");

    // Start chat
    startBtn.addEventListener("click", () => {
        chatContainer.style.display = "block";
        startBtn.style.display = "none";

        // Phase 2A: Ask for missing preferences
        if (!userPreferences.name) addMessage("Hey! What's your name?", "kova");
        else if (userPreferences.favoriteStyles.length === 0) addMessage("What styles do you like? (e.g., streetwear, Y2K)", "kova");
        else if (userPreferences.favoriteBrands.length === 0) addMessage("Any favorite brands?", "kova");
        else if (!userPreferences.budget) addMessage("What's your budget? (low, medium, high)", "kova");
        else if (userPreferences.favoriteColors.length === 0) addMessage("What colors do you like?", "kova");
    });

    // Add message
    function addMessage(text, sender) {
        const message = document.createElement("div");
        message.classList.add("message", sender);
        message.textContent = text;
        chatBox.appendChild(message);

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

    // Kova reply
    async function kovaReply(userMessage) {
        loading.style.display = "block";

        // Check if user is answering a preference question
        const msgLower = userMessage.toLowerCase();

        if (!userPreferences.name) {
            userPreferences.name = userMessage.trim();
            addMessage(`Got it! I'll remember your name.`, "kova");
        } else if (userPreferences.favoriteStyles.length === 0) {
            userPreferences.favoriteStyles = userMessage.split(",").map(s => s.trim());
            addMessage(`Perfect! I'll remember those styles.`, "kova");
        } else if (userPreferences.favoriteBrands.length === 0) {
            userPreferences.favoriteBrands = userMessage.split(",").map(s => s.trim());
            addMessage(`Great! Favorite brands saved.`, "kova");
        } else if (!userPreferences.budget) {
            userPreferences.budget = userMessage.trim();
            addMessage(`Budget noted!`, "kova");
        } else if (userPreferences.favoriteColors.length === 0) {
            userPreferences.favoriteColors = userMessage.split(",").map(c => c.trim());
            addMessage(`Colors saved!`, "kova");
        } else {
            // Normal conversation
            const reply = await sendToOpenAI([...sessionConversation, { sender: "user", text: userMessage }]);
            addMessage(reply, "kova");
            sessionConversation.push({ sender: "kova", text: reply });
            userPreferences.previousContext.push(reply);
        }

        // Update storage
        localStorage.setItem("kova_preferences", JSON.stringify(userPreferences));

        loading.style.display = "none";
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
