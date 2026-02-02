# RK Gaming Keyboard Configurator (Offline)

Offline version of the [drive2.rkgaming.com](https://drive2.rkgaming.com) WebHID keyboard configurator, allowing local key remapping without dependency on the remote site.

## Supported Keyboards

All RK Gaming keyboards with Vendor ID `0x1CA2` (7330), including:
- RK C98 (PID `0x160F`)
- And 25 other variants (PIDs `0x1601` to `0x161A`)

## Features

- Key remapping
- Per-key RGB lighting control
- Macro programming
- SOCD (Simultaneous Opposing Cardinal Directions) configuration
- DKS (Deep Key Sensing) configuration
- Dead zone adjustment
- Firmware update capability
- Multiple layout pages (up to 26)
- Windows / Mac mode switching

## Requirements

### Option A: Desktop App (Electron) - Recommended

- **Node.js** (v18 or later)

### Option B: Browser

- **Node.js** (v18 or later)
- **Google Chrome** or **Microsoft Edge** (WebHID support required)

## Installation

```bash
git clone https://github.com/Flalal/RKGaming-offline.git
cd RKGaming-offline
npm install
```

## Usage

### Option A: Desktop App (Electron) - Recommended

```bash
npm start
```

The app opens directly with full WebHID support. No browser needed, no certificate warning, no manual device selection - the RK keyboard is detected automatically.

To build a standalone Windows .exe installer:

```bash
npm run build
```

The installer will be generated in the `dist/` folder.

### Option B: Browser (legacy)

1. Start the local server:

```bash
node server.mjs
```

2. Open Chrome/Edge and navigate to:

```
https://localhost:8443
```

3. Accept the self-signed certificate warning (click "Advanced" > "Proceed to localhost").

4. Connect your RK keyboard and use the configurator.

## How It Works

### Electron (Desktop App)

The Electron app embeds a local HTTP server and loads the configurator in a Chromium window. WebHID permissions are automatically granted for RK Gaming devices (Vendor ID `0x1CA2`), so the keyboard is connected without any browser picker dialog.

### Browser

The project serves the original RK Gaming web configurator locally via a Node.js HTTPS server. The app uses the [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API) to communicate directly with the keyboard over USB.

WebHID requires a secure context (HTTPS or localhost), which is why the server generates a self-signed SSL certificate on first run.

### Communication Protocol

- **Vendor ID**: `0x1CA2` (7330)
- **HID Usage Page**: `0xFFA0` (65440) - Vendor-defined
- **HID Usage**: `1`
- **Report ID**: `0`
- **Packet size**: 64 bytes

### Project Structure

```
RKGaming-offline/
├── index.html                          # Entry point
├── main.js                             # Electron main process
├── preload.js                          # Electron preload script
├── package.json                        # Electron dependencies & build config
├── server.mjs                          # Node.js HTTPS server (browser mode)
├── index-C3DhiZUV.js                  # Main Vue.js bundle (core + WebHID service)
├── ConnectDrivePage-DUGSOpcv.js       # Connection page component
├── DeviceSettingPage-K4LopUby.js      # Device configuration page component
├── VBtn-RiwyMaVp.js                   # Vuetify button component
├── index-zRIK-F2f.css                 # Main stylesheet
├── ConnectDrivePage-CXKB1VGL.css      # Connection page styles
├── DeviceSettingPage-BJQDuvI_.css      # Device settings page styles
├── VBtn-Dyi06MPF.css                  # Vuetify button styles
├── assets/                             # Images and fonts
│   ├── bg-DIxIGayN.webp               # Background image
│   ├── logo-DgpZE-f6.png             # RK Gaming logo
│   ├── pic-zI0ewNaz.webp             # Decorative image
│   ├── check-CziJA3KU.png            # Check icon
│   ├── kedu-BYKrxX3P.png             # Scale/measurement image
│   └── materialdesignicons-webfont-Dp5v-WZN.woff2  # Icon font
└── .gitignore
```

## Notes

- The self-signed certificate (`cert.pem`, `key.pem`) is generated automatically on first run and excluded from git.
- If `openssl` is not available, the server falls back to HTTP on localhost (WebHID still works on `localhost` in Chrome).
- The original site JavaScript is minified and bundled with Vite.

## License

The source code of the RK Gaming configurator is property of RK Gaming. This project only provides a local serving mechanism for offline use.
