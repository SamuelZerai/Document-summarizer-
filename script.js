const button = document.getElementById("summarize-btn");
const clearBtn = document.getElementById("clear-btn");
const shutdownBtn = document.getElementById("shutdown-btn");
const textarea = document.getElementById("text-input");
const chat = document.getElementById("chat");
const fileInfo = document.getElementById("file-info");

const MAX_HISTORY = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

let conversationHistory = [
    { role: "system", content: "Du är en hjälpsam assistent. Svara alltid på svenska om inte användaren ber om annat." }
];
let extractedText = [];
let fileNames = [];

shutdownBtn.addEventListener("click", async function() {
    await fetch("/shutdown", { method: "POST" });
    window.close();
});

clearBtn.addEventListener("click", function() {
    chat.innerHTML = "";
    conversationHistory = [conversationHistory[0]]; // Behåll systemprompt
});

textarea.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        button.click();
    }
});

textarea.addEventListener("dragover", function(event) {
    event.preventDefault();
});

textarea.addEventListener("drop", async function(event) {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files);

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            alert(`${file.name} är för stor (max 10 MB)!`);
            continue;
        }

        const isPdf = file.type === "application/pdf";
        const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");
        const isDocx = file.name.endsWith(".docx");

        if (!isPdf && !isTxt && !isDocx) {
            alert(`${file.name}: Endast PDF, TXT och DOCX-filer stöds!`);
            continue;
        }

        let text = "";

        if (isPdf) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(" ") + "\n";
            }
        } else if (isTxt) {
            text = await file.text();
        } else if (isDocx) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        }

        extractedText.push(text);
        fileNames.push(file.name);
    }

    if (fileNames.length > 0) {
        textarea.placeholder = "Klistra in din text eller släpp din fil här!";
        fileInfo.style.display = "block";
        renderFileInfo();
    }
});

function renderFileInfo() {
    fileInfo.innerHTML = "";
    fileNames.forEach(function(name, index) {
        const item = document.createElement("span");
        item.textContent = "📄 " + name;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "❌";
        removeBtn.className = "remove-btn";
        removeBtn.onclick = function() {
            fileNames.splice(index, 1);
            extractedText.splice(index, 1);
            if (fileNames.length === 0) {
                fileInfo.style.display = "none";
            } else {
                renderFileInfo();
            }
        };

        item.appendChild(removeBtn);
        fileInfo.appendChild(item);
    });
}

function addCopyButton(message, getText) {
    const btn = document.createElement("button");
    btn.textContent = "Kopiera";
    btn.className = "copy-btn";
    btn.onclick = function() {
        navigator.clipboard.writeText(getText()).then(() => {
            btn.textContent = "Kopierat!";
            setTimeout(() => btn.textContent = "Kopiera", 2000);
        });
    };
    message.appendChild(btn);
}

function addMessage(role, text, files = []) {
    const message = document.createElement("div");
    message.className = role === "user" ? "message-user" : "message-ai";

    if (files.length > 0) {
        files.forEach(function(name) {
            const fileTag = document.createElement("div");
            fileTag.textContent = "📄 " + name;
            fileTag.className = "file-tag";
            message.appendChild(fileTag);
        });
    }

    if (text) {
        const textNode = document.createElement("div");
        if (role === "ai") {
            textNode.innerHTML = marked.parse(text);
        } else {
            textNode.textContent = text;
        }
        message.appendChild(textNode);
    }

    if (role === "ai" && text) {
        addCopyButton(message, () => text);
    }

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
}

button.addEventListener("click", async function() {
    const userInput = textarea.value;
    const userText = extractedText.length > 0
        ? extractedText.join("\n\n") + "\n\n" + userInput
        : userInput;

    if (userText.trim() === "") {
        alert("Skriv ett meddelande!");
        return;
    }

    addMessage("user", userInput, fileNames);
    conversationHistory.push({ role: "user", content: userText });

    if (conversationHistory.length > MAX_HISTORY + 1) {
        conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-MAX_HISTORY)];
    }

    textarea.value = "";
    extractedText = [];
    fileNames = [];
    fileInfo.style.display = "none";

    button.disabled = true;

    const loadingMsg = document.createElement("div");
    loadingMsg.className = "message-ai loading";
    loadingMsg.textContent = "skriver...";
    chat.appendChild(loadingMsg);
    chat.scrollTop = chat.scrollHeight;

    try {
        const response = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3.2",
                messages: conversationHistory,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama svarade med status ${response.status}`);
        }

        chat.removeChild(loadingMsg);

        const aiMessage = document.createElement("div");
        aiMessage.className = "message-ai";
        const textNode = document.createElement("div");
        aiMessage.appendChild(textNode);
        chat.appendChild(aiMessage);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value).split("\n").filter(l => l.trim());
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.message?.content) {
                        fullText += data.message.content;
                        textNode.innerHTML = marked.parse(fullText);
                        chat.scrollTop = chat.scrollHeight;
                    }
                } catch { /* hoppa över trasiga chunks */ }
            }
        }

        addCopyButton(aiMessage, () => fullText);
        conversationHistory.push({ role: "assistant", content: fullText });

    } catch (error) {
        addMessage("ai", "Något gick fel: " + error.message);
        console.error(error);
    } finally {
        if (loadingMsg.parentNode) chat.removeChild(loadingMsg);
        button.disabled = false;
    }
});
