// Load API key
const kovaApiKey = localStorage.getItem("kova_api");
const shopifyToken = localStorage.getItem("shopify_token");

// Temporary fallback products before Shopify sync
const productCatalog = [
    { name: "Streetwear Oversized Hoodie", style: "streetwear", img: "https://via.placeholder.com/200", price: "$45" },
    { name: "Baggy Cargo Pants", style: "streetwear", img: "https://via.placeholder.com/200", price: "$60" },
    { name: "Cozy Knit Sweater", style: "cozy", img: "https://via.placeholder.com/200", price: "$50" },
    { name: "Soft Lounge Joggers", style: "cozy", img: "https://via.placeholder.com/200", price: "$40" },
    { name: "Y2K Baby Tee", style: "y2k", img: "https://via.placeholder.com/200", price: "$25" },
    { name: "Rhinestone Mini Skirt", style: "y2k", img: "https://via.placeholder.com/200", price: "$35" }
];

let shopifyProducts = [];

// Fetch real products from store
async function loadShopifyProducts() {
    try {
        const response = await fetch("/products.json", {
            headers: { "X-Shopify-Storefront-Access-Token": shopifyToken }
        });

        const data = await response.json();

        shopifyProducts = data.products.map(p => ({
            name: p.title,
            price: p.variants?.[0]?.price || "$?",
            img: p.images?.[0]?.src || "",
            style: "general"
        }));

        console.log("Shopify products loaded:", shopifyProducts);
    } catch (err) {
        console.warn("Shopify product fetch failed, using fallback.");
    }
}

// Hybrid product logic
function getAvailableProducts() {
    return shopifyProducts.length > 0 ? shopifyProducts : productCatalog;
}

function findMatchingProducts(message) {
    const msg = message.toLowerCase();
    const styles = ["streetwear", "cozy", "y2k"];
    const match = styles.find(s => msg.includes(s));
    if (!match) return [];
    return getAvailableProducts().filter(item => item.style === match);
}

let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
let sessionConversation = [...chatHistory];

document.addEventListener("DOMContentLoaded", () => {

    loadShopifyProducts();

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
        const el = document.createElement("div");
        el.classList.add("message", sender);
        el.textContent = text;
        chatBox.appendChild(el);

        chatHistory.push({ sender, text });
        sessionConversation.push({ sender, text });
        sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function displayProducts(products) {
        const grid = document.getElementById("productGrid");
        grid.innerHTML = "";
        products.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("product-item");
            card.innerHTML = `
                <img src="${item.img}">
                <div class="product-info">
                    <p>${item.name}</p>
                    <p>${item.price}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        grid.style.display = "block";
    }

    async function sendToOpenAI(messagesArray) {
        const apiMessages = [
            { role: "system", content: "You are Kova, an AI fashion stylist. Be direct." },
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
            body: JSON.stringify({ model: "gpt-4.1-mini", messages: apiMessages })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "⚠️ Error.";
    }

    async function kovaReply(userMessage) {
        loading.style.display = "block";

        const matches = findMatchingProducts(userMessage);
        if (matches.length > 0) {
            displayProducts(matches);
            addMessage("🔥 These match exactly what you're asking for.", "kova");
        }

        sessionConversation.push({ sender: "user", text: userMessage });
        const reply = await sendToOpenAI(sessionConversation);

        loading.style.display = "none";
        addMessage(reply, "kova");

        sessionConversation.push({ sender: "kova", text: reply });
    }

    sendBtn.addEventListener("click", () => {
        const msg = inputField.value.trim();
        if (!msg) return;
        addMessage(msg, "user");
        inputField.value = "";
        kovaReply(msg);
    });

    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendBtn.click();
    });

    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
