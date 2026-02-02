const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Vendor ID for RK Gaming keyboards
const RK_VENDOR_ID = 0x1ca2;

// MIME types (same as server.mjs)
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// SPA routes that should serve index.html
const SPA_ROUTES = ["/", "/connect", "/device"];

// Resolve the path to the web app files
function getAppFilesRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app-files");
  }
  return __dirname;
}

// Start a local HTTP server to serve the app files
function startLocalServer() {
  return new Promise((resolve) => {
    const root = getAppFilesRoot();

    const server = http.createServer((req, res) => {
      let url = req.url.split("?")[0];

      // SPA routing
      if (SPA_ROUTES.includes(url)) {
        url = "/index.html";
      }

      const filePath = path.join(root, url);

      // Security: prevent path traversal
      const resolvedPath = path.resolve(filePath);
      const resolvedRoot = path.resolve(root);
      if (!resolvedPath.startsWith(resolvedRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(resolvedPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found: " + url);
          return;
        }
        const ext = path.extname(resolvedPath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": mimeType });
        res.end(data);
      });
    });

    // Listen on random available port on localhost
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      console.log(`[Electron] Local server running on http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "RK Gaming Configurator",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // --- WebHID Permissions ---

  // Layer 1: Allow RK Gaming devices at device-level
  win.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === "hid") {
      const device = details.device;
      if (device && device.vendorId === RK_VENDOR_ID) {
        return true;
      }
    }
    return false;
  });

  // Layer 2: Allow HID permission checks
  win.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      if (permission === "hid") {
        return true;
      }
      return true;
    }
  );

  // Layer 3: Auto-select RK keyboard (replaces browser HID picker)
  win.webContents.session.on(
    "select-hid-device",
    (event, details, callback) => {
      event.preventDefault();
      const rkDevice = details.deviceList.find(
        (d) => d.vendorId === RK_VENDOR_ID
      );
      if (rkDevice) {
        callback(rkDevice.deviceId);
      } else {
        callback();
      }
    }
  );

  win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(async () => {
  const port = await startLocalServer();
  createWindow(port);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(port);
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
