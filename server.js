const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PORT = 3000;

const mimeTypes = {
    ".html": "text/html",
    ".css":  "text/css",
    ".js":   "application/javascript",
};

const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/shutdown") {
        res.writeHead(200);
        res.end();
        exec("taskkill /IM ollama.exe /F", () => {
            server.close(() => process.exit(0));
        });
        return;
    }

    const filePath = path.resolve(__dirname, req.url === "/" ? "index.html" : req.url.slice(1));

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "text/plain";

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found");
            return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`homeBot körs på http://localhost:${PORT}`);
});
