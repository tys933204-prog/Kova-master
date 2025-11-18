async function sendToOpenAI(message) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("kova_api")}`,
        },
        body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [{
                role: "system",
                content: "You are Kova, an AI fashion assistant. Speak with confidence, style, and warmth."
            }, {
                role: "user",
                content: message
            }]
        })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ Something went wrong.";
}
const chatBox = document.getElementById("messages");
const inputField = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, sender) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.style.margin = "8px 0";
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}
async function kovaReply(userMessage) {
    const reply = await sendToOpenAI(userMessage);
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
