import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import crypto from "node:crypto";

const PORT = 8443;
const ROOT = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1").replace(/\//g, path.sep);

console.log("ROOT:", ROOT);

const MIME_TYPES = {
    ".html":  "text/html",
    ".js":    "application/javascript",
    ".css":   "text/css",
    ".png":   "image/png",
    ".jpg":   "image/jpeg",
    ".webp":  "image/webp",
    ".svg":   "image/svg+xml",
    ".ico":   "image/x-icon",
    ".json":  "application/json",
    ".woff":  "font/woff",
    ".woff2": "font/woff2",
    ".ttf":   "font/ttf",
};

function handler(req, res) {
    let url = req.url.split("?")[0];

    // SPA: redirect unknown routes to index.html
    if (url === "/" || url === "/connect" || url === "/device") {
        url = "/index.html";
    }

    const filePath = path.resolve(ROOT, "." + url);

    // Security: prevent path traversal
    if (!filePath.startsWith(path.resolve(ROOT))) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found: " + url);
            return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

// Generate self-signed certificate in memory
function generateSelfSignedCert() {
    const certPath = path.resolve(ROOT, "cert.pem");
    const keyPath = path.resolve(ROOT, "key.pem");

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
        };
    }

    console.log("Generating self-signed certificate...");

    try {
        execSync(
            `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 3650 -nodes -subj "/CN=localhost"`,
            { stdio: "pipe" }
        );
        return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
        };
    } catch {
        console.log("openssl not found, falling back to HTTP on localhost (WebHID works on localhost without HTTPS in Chrome).");
        return null;
    }
}

const certs = generateSelfSignedCert();

if (certs) {
    const server = https.createServer(certs, handler);
    server.listen(PORT, () => {
        console.log(`\n  RK Gaming Configurator (HTTPS)`);
        console.log(`  -> https://localhost:${PORT}`);
        console.log(`\n  Note: Your browser will warn about the self-signed certificate.`);
        console.log(`  Click "Advanced" then "Proceed to localhost" to continue.\n`);
    });
} else {
    // Fallback: localhost HTTP - WebHID works on localhost even without HTTPS
    const server = http.createServer(handler);
    server.listen(PORT, () => {
        console.log(`\n  RK Gaming Configurator (HTTP localhost)`);
        console.log(`  -> http://localhost:${PORT}`);
        console.log(`\n  WebHID should work on localhost in Chrome.\n`);
    });
}
