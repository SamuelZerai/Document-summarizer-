const button = document.getElementById("summarize-btn");
const textarea = document.getElementById("text-input");



button.addEventListener("click", async function () {
    const text = textarea.value;
   
    if (text.trim() === "") {
        alert("Klistra in din text innan du sammanfattar!");
        return
    }

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama3.2",
            prompt: "Sammanfatta följande texter på svenska " + text,
            stream: false
        })
    });

    const data = await response.json();
    console.log(data);

});