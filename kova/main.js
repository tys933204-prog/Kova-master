// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Load chat history and preferences
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {
    favoriteStyles: [],
    favoriteBrands: [],
    budget: "",
    favoriteColors: [],
    previousContext: []
};

// Hardcoded product list
const products = [
    { id: 1, name: "Streetwear Hoodie", imageUrl: "https://via.placeholder.com/60", price: "$50", brand: "Brand A", styleTags: ["streetwear", "hoodie"], link: "#" },
    { id: 2, name: "Y2K T-Shirt", imageUrl: "https://via.placeholder.com/60", price: "$30", brand: "Brand B", styleTags: ["y2k", "t-shirt"], link: "#" },
    { id: 3, name: "Cozy Sweater", imageUrl: "https://via.placeholder.com/60", price: "$45", brand: "Brand C", styleTags: ["cozy", "sweater"], link: "#" },
    { id: 4, name: "Minimal Sneakers", imageUrl: "https://via.placeholder.com/60", price: "$60", brand: "Brand D", styleTags: ["minimal", "shoes"], link: "#" },
    { id: 5, name: "Business Casual Blazer", imageUrl: "https://via.placeholder.com/60", price: "$120", brand: "Brand E", styleTags: ["business casual", "blazer"], link: "#" }
];

// Function to show products based on style
function showProductsForStyle(style) {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = "";
    const filtered = products.filter(p => p.styleTags.includes(style.toLowerCase()));
    if (filtered.length === 0) {
        grid.style.display = "none";
        return;
    }
    grid.style.display = "block";
    filtered.forEach(p => {
        const item = document.createElement("div");
        item.classList.add("product-item");
        item.innerHTML = `
            <img src="${p.imageUrl}" alt="${p.name}" />
            <div class="product-info">
                <p><strong>${p.name}</strong></p>
                <p>${p.brand}</p>
                <p>${p.price}</p>
            </div>
            <button onclick="window.open('${p.link}', '_blank')">View / Buy</button>
        `;
        grid.appendChild(item);
    });
}

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

    // Kova reply
    async function kovaReply(userMessage) {
        loading.style.display = "block";
        addMessage(userMessage, "user");

        // Check for style keywords
        const styleKeywords = ["streetwear","y2k","minimal","cozy","hoodie","t-shirt","shoes","blazer"];
        styleKeywords.forEach(style => {
            if (userMessage.toLowerCase().includes(style)) {
                showProductsForStyle(style);
            }
        });

        const reply = await sendToOpenAI(userMessage);
        loading.style.display = "none";
        addMessage(reply, "kova");
    }

    // Send button
    sendBtn.addEventListener("click", () => {
        const message = inputField.value.trim();
        if (!message) return;
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
