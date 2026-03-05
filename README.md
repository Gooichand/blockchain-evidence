# 🔐 EVID-DGC

**Blockchain Evidence Management System**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node--version-%3E%3D16-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

---

## 📌 Overview

EVID-DGC is a secure, role-based evidence management platform designed for law enforcement,
forensic analysts, legal professionals and court officials. The system combines traditional
backend APIs with blockchain anchoring and IPFS storage to provide immutable, verifiable
records and a full audit trail.


## 📗 Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Phases](#project-phases)
4. [Getting Started](#getting-started)
5. [Folder Structure](#folder-structure)
6. [Contributing](#contributing)
7. [License](#license)

---

## ✨ Features

- **Multi-role access control** with 8 predefined roles
- **Dual authentication**: MetaMask (Web3) & email/password + 2FA
- **Evidence upload/download** with metadata, size limits, watermarking
- **Blockchain anchoring** (Polygon Amoy) & IPFS decentralized storage
- **Real-time notifications** via WebSocket
- **Comprehensive audit trail** & cryptographic verification
- **Admin dashboard** for user/role management
- **Responsive UI** built with vanilla JS & Lucide icons
- **Robust security**: RLS, input validation, rate limiting


## 🛠 Tech Stack

| Component      | Technology                          |
| -------------- | ----------------------------------- |
| Backend        | Node.js, Express.js, Supabase       |
| Frontend       | HTML, CSS, Vanilla JS, Lucide Icons |
| Blockchain     | Solidity, Polygon Amoy testnet      |
| Storage        | Supabase (Postgres), IPFS (Pinata)  |
| Real-time      | Socket.IO                           |
| Dev Tools      | Hardhat, Jest, ESLint               |


## 📈 Project Phases

1. **Phase 1 – Core System** *(Completed Dec 2025)*
   - Authentication, RBAC, evidence management, admin/UI features.
2. **Phase 2 – Blockchain & IPFS** *(Completed Jan 2026)*
   - Polygon smart contracts, IPFS storage, monitoring, security hardening.
3. **Phase 3 – Forensic Enhancements** *(In Progress 2026)*
   - AI detection, metadata forensics, automated verification, legal tools.

> **Phase 3 Highlights**
> - AI-powered deepfake/audio analysis
> - EXIF/metadata validation engine
> - Continuous hash verification & alerting
> - Quality & admissibility scoring framework


## 🚀 Getting Started

1. **Clone repo**
   ```bash
   git clone https://github.com/Gooichand/blockchain-evidence.git
   cd blockchain-evidence-1
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure env** (see `.env.example`)
4. **Run locally**
   ```bash
   npm run dev
   ```

Refer to the [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for full setup instructions.


## 📁 Folder Structure

```
blockchain-evidence/
+-- contracts/           # Solidity contracts
+-- docs/                # Documentation (deployment, security, etc.)
+-- public/              # Frontend pages & assets
+-- controllers/         # Express route handlers
+-- middleware/          # Express middleware
+-- services/            # Business logic
+-- migrations/          # SQL migrations
+-- tests/               # Jest test suites
+-- utils/               # Helper modules
```


## 🤝 Contributing

- Fork the repository and create a feature branch.
- Follow coding standards (ESLint/config).
- Write tests for new features.
- Submit a pull request with a clear description.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.


## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

*Last updated: March?5?2026*
