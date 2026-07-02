# OpenWrt Manager

> 🚀 Native cross-platform desktop app for managing OpenWrt routers — faster than the web UI, built with Tauri + React.

![Dashboard](assets/screenshots/dashboard.png)
![Connection](assets/screenshots/connection.png)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | System info, memory/storage usage, CPU load graphs, uptime, firmware version — at a glance |
| 🔌 **Network** | List interfaces, IP addresses, status, traffic |
| 📡 **Wireless** | Radio status, SSIDs, encryption, signal strength |
| 🛡️ **Firewall** | Zones, rules, forwarding |
| 🖥️ **DHCP & DNS** | Pools, static leases, server config |
| 🔀 **Routes** | Active routes, static routes |
| ⚙️ **System** | Device info, reboot, open LuCI |
| 🌙 **Dark Mode** | Automatic light/dark theme |
| 🔐 **Password Save** | Credentials stored securely, auto-login on startup |

## 🖥️ Cross-Platform

| Platform | Binary |
|----------|--------|
| macOS Intel | `.dmg`, `.app` |
| macOS ARM (Apple Silicon) | `.dmg`, `.app` |
| Windows x64 | `.msi`, `.exe` |
| Windows ARM64 | `.msi` |
| Linux x64 | `.deb`, `.AppImage` |
| Linux ARM (Raspberry Pi) | `.deb`, `.AppImage` |
| Linux ARM64 | `.deb`, `.AppImage` |

## 🚀 Quick Start

### Download

Grab the latest release from the [Releases page](https://github.com/ismkdc/openwrt-manager/releases).

### Build from source

```bash
# Prerequisites
# Install Rust: https://rustup.rs
# Install Node.js: https://nodejs.org

git clone https://github.com/ismkdc/openwrt-manager.git
cd openwrt-manager

# Install frontend deps
npm install

# Build & run in dev mode
npx tauri dev

# Build for production
npx tauri build
```

## 🏗️ Architecture

```
openwrt-manager/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page views (Dashboard, Network, etc.)
│   └── services/           # API client (ubus)
├── src-tauri/              # Rust backend
│   └── src/
│       ├── ubus.rs         # OpenWrt ubus JSON-RPC client
│       └── commands.rs     # Tauri command handlers
└── .github/workflows/      # CI/CD pipelines
```

### How it works

The app communicates with OpenWrt routers via the **ubus** JSON-RPC protocol over HTTP — the same protocol LuCI (the web UI) uses internally. No SSH required, no agent installation needed on the router.

1. Connect to your router's IP
2. Login with root credentials
3. Read real-time system data via ubus calls
4. Modify configuration via UCI

## 🔧 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Rust + Tauri 2.x
- **Icons**: lucide-react
- **Protocol**: ubus JSON-RPC (same as LuCI)
- **Build**: GitHub Actions (matrix builds for 8 platforms)

## 📸 Screenshots

| Dashboard | Network | Wireless |
|:---:|:---:|:---:|
| ![Dashboard](assets/screenshots/dashboard.png) | ![Network](assets/screenshots/network.png) | ![Wireless](assets/screenshots/wireless.png) |

## 🤝 Contributing

PRs welcome! This is a community project — the more contributors, the better the router management experience gets.

## 📄 License

MIT
