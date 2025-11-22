// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Temporary product list (we will replace later with Shopify)
const productCatalog = [
    { name: "Streetwear Oversized Hoodie", style: "streetwear", img: "https://via.placeholder.com/200", price: "$45" },
    { name: "Baggy Cargo Pants", style: "streetwear", img: "https://via.placeholder.com/200", price: "$60" },
    { name: "Cozy Knit Sweater", style: "cozy", img: "https://via.placeholder.com/200", price: "$50" },
    { name: "Soft Lounge Joggers", style: "cozy", img: "https://via.placeholder.com/200", price: "$40" },
    { name: "Y2K Baby Tee", style: "y2k", img: "https://via.placeholder.com/200", price: "$25" },
    { name: "Rhinestone Mini Skirt", style: "y2k", img: "https://via.placeholder.com/200", price: "$35" }
];

// Detect style keywords and return matching products
function findMatchingProducts(message) {
    const msg = message.toLowerCase();
    const styles = ["streetwear", "cozy", "y2k"];
    const matchedStyle = styles.find(style => msg.includes(style));
    if (!matchedStyle) return [];
    return productCatalog.filter(item => item.style === matchedStyle);
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

// Track full session conversation
let sessionConversation = [...chatHistory];

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startChat");
    const chatContainer = document.getElementById("chatContainer");
    const sendBtn = document.getElementById("sendBtn");
    const inputField = document.getElementById("userInput");
    const chatBox = document.getElementById("messages");
    const loading = document.getElementById("loading");

    startBtn.addEventListener("click", () => {
        chatContainer.style.display = "block";
        startBtn.style.display = "none";
    });

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

    function displayProducts(products) {
        const grid = document.getElementById("productGrid");
        if (!grid) return;

        grid.innerHTML = "";

        products.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("product-item");
            card.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="product-info">
                    <p>${item.name}</p>
                    <p>${item.price}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }

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

    async function kovaReply(userMessage) {
        loading.style.display = "block";

        // NEW: Detect and respond
        const matches = findMatchingProducts(userMessage);
        if (matches.length > 0) {
            displayProducts(matches);
            addMessage("✨ Love that pick — I pulled some pieces I think you'd vibe with.", "kova");
        }

        sessionConversation.push({ sender: "user", text: userMessage });
        userPreferences.previousContext.push(userMessage);

        const reply = await sendToOpenAI(sessionConversation);

        loading.style.display = "none";
        addMessage(reply, "kova");

        sessionConversation.push({ sender: "kova", text: reply });
        userPreferences.previousContext.push(reply);

        const msgLower = userMessage.toLowerCase();
        if (msgLower.includes("style:")) {
            const style = msgLower.split("style:")[1].trim();
            if (!userPreferences.favoriteStyles.includes(style)) userPreferences.favoriteStyles.push(style);
        }

        localStorage.setItem("kova_preferences", JSON.stringify(userPreferences));
    }

    sendBtn.addEventListener("click", () => {
        const message = inputField.value.trim();
        if (!message) return;
        addMessage(message, "user");
        inputField.value = "";
        kovaReply(message);
    });

    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendBtn.click();
    });

    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
