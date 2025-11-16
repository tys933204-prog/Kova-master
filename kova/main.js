window.OPENAI_API_KEY = localStorage.getItem("kova_api");
async function sendToOpenAI(message) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${window.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [{
                role: "system",
                content: "You are Kova, a fashionable AI assistant."
            }, {
                role: "user",
                content: message
            }]
        })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Something went wrong.";
}
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

// This is just a sample script. Paste your real code (javascript or HTML) here.

if ('this_is' == /an_example/) {
    of_beautifier();
} else {
    var a = b ? (c % d) : e[f];
}
