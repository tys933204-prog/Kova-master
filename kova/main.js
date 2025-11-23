// Load API keys from local storage
const kovaApiKey = localStorage.getItem("kova_api");
const shopifyToken = localStorage.getItem("shopify_token");

// If no OpenAI key, prompt user
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// Fallback demo products
const fallbackProducts = [
    { name: "Streetwear Oversized Hoodie", style: "streetwear", img: "https://via.placeholder.com/200", price: "$45" },
    { name: "Baggy Cargo Pants", style: "streetwear", img: "https://via.placeholder.com/200", price: "$60" },
    { name: "Cozy Knit Sweater", style: "cozy", img: "https://via.placeholder.com/200", price: "$50" },
    { name: "Soft Lounge Joggers", style: "cozy", img: "https://via.placeholder.com/200", price: "$40" },
    { name: "Y2K Baby Tee", style: "y2k", img: "https://via.placeholder.com/200", price: "$25" },
    { name: "Rhinestone Mini Skirt", style: "y2k", img: "https://via.placeholder.com/200", price: "$35" }
];

let shopifyProducts = [];

// ---- FETCH REAL SHOPIFY PRODUCTS ----
async function loadShopifyProducts() {
    try {
        const res = await fetch("/products.json", {
            headers: { "X-Shopify-Storefront-Access-Token": shopifyToken }
        });

        const data = await res.json();

        shopifyProducts = data.products.map((p) => ({
            name: p.title,
            price: p.variants?.[0]?.price || "$?",
            img: p.image?.src || p.images?.[0]?.src || "",
            url: `/products/${p.handle}`,
            style: "general"
        }));

        console.log("Shopify products loaded:", shopifyProducts);

    } catch (err) {
        console.warn("Shopify fetch failed — using fallback products.");
    }
}

// Return real products if available, else fallback
function getAvailableProducts() {
    return shopifyProducts.length > 0 ? shopifyProducts : fallbackProducts;
}

// Detect fashion style keywords
function findMatchingProducts(message) {
    const msg = message.toLowerCase();
    const styles = ["streetwear", "cozy", "y2k"];
    const match = styles.find(s => msg.includes(s));
    if (!match) return [];
    return getAvailableProducts().filter(item => item.style === match);
}

// Load saved chat history
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
let sessionConversation = [...chatHistory];

document.addEventListener("DOMContentLoaded", () => {

    loadShopifyProducts();

    const startBtn = document.getElementById("startChat");
    const sendBtn = document.getElementById("sendBtn");
    const inputField = document.getElementById("userInput");
    const messagesDiv = document.getElementById("messages");
    const loading = document.getElementById("loading");
    const chatContainer = document.getElementById("chatContainer");

    // START BUTTON
    startBtn.addEventListener("click", () => {
        chatContainer.style.display = "block";
        startBtn.style.display = "none";
    });

    // Add chat bubble
    function addMessage(text, sender) {
        const el = document.createElement("div");
        el.classList.add("message", sender);
        el.textContent = text;
        messagesDiv.appendChild(el);

        chatHistory.push({ sender, text });
        sessionConversation.push({ sender, text });
        sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Display product cards
    function displayProducts(products) {
        const grid = document.getElementById("productGrid");
        grid.innerHTML = "";

        products.forEach((item) => {
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

    // Send chat query to OpenAI API
    async function sendToOpenAI(messagesArray) {
        const apiMessages = [
            { role: "system", content: "You are Kova, an AI fashion stylist. Respond with confidence and direct styling advice." },
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
        return data.choices?.[0]?.message?.content || "⚠️ Error.";
    }

    async function kovaReply(userMessage) {
        loading.style.display = "block";

        const matches = findMatchingProducts(userMessage);
        if (matches.length > 0) {
            displayProducts(matches);
            addMessage("🔥 These pieces match your vibe.", "kova");
        }

        sessionConversation.push({ sender: "user", text: userMessage });

        const reply = await sendToOpenAI(sessionConversation);

        loading.style.display = "none";
        addMessage(reply, "kova");

        sessionConversation.push({ sender: "kova", text: reply });
    }

    // Send button
    sendBtn.addEventListener("click", () => {
        const msg = inputField.value.trim();
        if (!msg) return;
        addMessage(msg, "user");
        inputField.value = "";
        kovaReply(msg);
    });

    // Enter key
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendBtn.click();
    });

    // Restore previous messages
    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
