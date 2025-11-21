// ---- Load API Key ----
const kovaApiKey = localStorage.getItem("kova_api");
if (!kovaApiKey) {
    const key = prompt("Enter your OpenAI API key to activate Kova:");
    if (key) localStorage.setItem("kova_api", key);
}

// ---- Load stored memory ----
let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];

let userPreferences = JSON.parse(localStorage.getItem("kova_preferences")) || {
    name: "",
    favoriteStyles: [],
    favoriteBrands: [],
    budget: "",
    favoriteColors: [],
    lastMessage: ""
};

// ---- Test product list ----
const products = [
    { id: 1, name: "Streetwear Hoodie", imageUrl: "https://via.placeholder.com/60", price: "$50", brand: "Brand A", styleTags: ["streetwear", "hoodie"], link: "#" },
    { id: 2, name: "Y2K T-Shirt", imageUrl: "https://via.placeholder.com/60", price: "$30", brand: "Brand B", styleTags: ["y2k", "t-shirt"], link: "#" },
    { id: 3, name: "Cozy Sweater", imageUrl: "https://via.placeholder.com/60", price: "$45", brand: "Brand C", styleTags: ["cozy", "sweater"], link: "#" },
    { id: 4, name: "Minimal Sneakers", imageUrl: "https://via.placeholder.com/60", price: "$60", brand: "Brand D", styleTags: ["minimal", "shoes"], link: "#" },
    { id: 5, name: "Business Blazer", imageUrl: "https://via.placeholder.com/60", price: "$120", brand: "Brand E", styleTags: ["business", "blazer"], link: "#" }
];

// ---- Product display function ----
function showProducts(style) {
    const grid = document.getElementById("productGrid");
    const filtered = products.filter(item => item.styleTags.includes(style.toLowerCase()));

    grid.innerHTML = "";
    if (filtered.length === 0) {
        grid.style.display = "none";
        return;
    }

    grid.style.display = "block";
    filtered.forEach(p => {
        const item = document.createElement("div");
        item.classList.add("product-item");
        item.innerHTML = `
            <img src="${p.imageUrl}">
            <div class="product-info">
                <p><strong>${p.name}</strong></p>
                <p>${p.brand}</p>
                <p>${p.price}</p>
            </div>
            <button onclick="window.open('${p.link}', '_blank')">View</button>
        `;
        grid.appendChild(item);
    });
}

// ---- Add message UI ----
function addMessage(text, sender) {
    const box = document.getElementById("messages");
    const msg = document.createElement("div");

    msg.classList.add("message", sender);
    msg.textContent = text;
    box.appendChild(msg);

    chatHistory.push({ sender, text });
    sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));

    box.scrollTop = box.scrollHeight;
}

// ---- AI request ----
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
                { role: "system", content: `
                    You are Kova — the confident, stylish AI fashion assistant.
                    If the user tells you their name, remember it.
                    Use it rarely, only when natural.
                    Use saved preferences in future replies.
                ` },
                ...chatHistory.map(m => ({
                    role: m.sender === "user" ? "user" : "assistant",
                    content: m.text
                })),
                { role: "user", content: message }
            ]
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ Something went wrong.";
}

// ---- Respond + detect style & save memory ----
async function kovaReply(input) {
    const loading = document.getElementById("loading");
    loading.style.display = "block";

    addMessage(input, "user");

    // save last message
    userPreferences.lastMessage = input;

    // detect name
    if (input.toLowerCase().startsWith("my name is")) {
        userPreferences.name = input.replace(/my name is/i, "").trim();
        localStorage.setItem("kova_preferences", JSON.stringify(userPreferences));
    }

    // detect fashion styles
    const keywords = ["streetwear","y2k","minimal","cozy","hoodie","shoes","blazer"];
    const detected = keywords.find(k => input.toLowerCase().includes(k));
    if (detected) showProducts(detected);

    const reply = await sendToOpenAI(input);

    loading.style.display = "none";
    addMessage(reply, "kova");
}

// ---- UI Events ----
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("startChat").onclick = () => {
        document.getElementById("chatContainer").style.display = "block";
    };

    document.getElementById("sendBtn").onclick = () => {
        const input = document.getElementById("userInput");
        if (input.value.trim() !== "") {
            kovaReply(input.value.trim());
            input.value = "";
        }
    };

    document.getElementById("userInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") document.getElementById("sendBtn").click();
    });

    // Reload chat on refresh
    chatHistory.forEach(msg => addMessage(msg.text, msg.sender));
});
