// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Phase 2: Hardcoded product list
const products = [
    {
        id: 1,
        name: "Streetwear Hoodie",
        imageUrl: "https://via.placeholder.com/150",
        price: "$45",
        brand: "CoolBrand",
        styleTags: ["streetwear", "hoodie", "casual"],
        link: "#"
    },
    {
        id: 2,
        name: "Y2K Denim Jacket",
        imageUrl: "https://via.placeholder.com/150",
        price: "$60",
        brand: "RetroVibe",
        styleTags: ["y2k", "jacket", "casual"],
        link: "#"
    },
    {
        id: 3,
        name: "Minimalist Sneakers",
        imageUrl: "https://via.placeholder.com/150",
        price: "$80",
        brand: "ShoeCo",
        styleTags: ["minimal", "shoes", "casual"],
        link: "#"
    },
    {
        id: 4,
        name: "Cozy Sweater",
        imageUrl: "https://via.placeholder.com/150",
        price: "$55",
        brand: "WarmWear",
        styleTags: ["cozy", "sweater", "casual"],
        link: "#"
    },
    {
        id: 5,
        name: "Business Casual Pants",
        imageUrl: "https://via.placeholder.com/150",
        price: "$70",
        brand: "OfficeFit",
        styleTags: ["business casual", "pants", "formal"],
        link: "#"
    }
];

// Load chat history and preferences
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {
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

    // Kova reply with full session memory
    async function kovaReply(userMessage) {
        loading.style.display = "block";

        sessionConversation.push({ sender: "user", text: userMessage });
        userPreferences.previousContext.push(userMessage);

        const reply = await sendToOpenAI(sessionConversation);
        loading.style.display = "none";
        addMessage(reply, "kova");

        sessionConversation.push({ sender: "kova", text: reply });
        userPreferences.previousContext.push(reply);

        // Optional: parse userMessage for quick preference updates
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

    // Load saved chat history
    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
