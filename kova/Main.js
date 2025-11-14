const chatBox = document.getElementById("chat-box");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function addMessage(text, sender) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;
    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function kovaReply(userMessage) {
    // Placeholder response for now
    const response = "I'm Kova 🤍 -- and I'm here. Tell me what you're thinking.";
    addMessage(response, "kova");
}

sendBtn.addEventListener("click", () => {
    const message = inputField.value.trim();
    if (!message) return;

    addMessage(message, "user");
    inputField.value = "";

    setTimeout(() => kovaReply(message), 500);
});

inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendBtn.click();
    }
});