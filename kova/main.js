let chatHistory = JSON.parse(sessionStorage.getItem("kova_chat")) || [];
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
        message.style.margin = "8px 0";
        message.textContent = text;
        chatBox.appendChild(message);
        chatHistory.push({ sender, text });
sessionStorage.setItem("kova_chat", JSON.stringify(chatHistory));
        chatBox.scrollTop = chatBox.scrollHeight;
    }

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

    async function kovaReply(userMessage) {
    loading.style.display = "block";      // Show loading
    const reply = await sendToOpenAI(userMessage);
    loading.style.display = "none";       // Hide loading
    addMessage(reply, "kova");
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
