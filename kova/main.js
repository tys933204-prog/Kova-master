window.OPENAI_API_KEY = "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";
async function sendToOpenAI(message) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${window.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Kova, a fashionable AI assistant." },
        { role: "user", content: message }
      ]
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
