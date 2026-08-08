# 🔐 EVID-DGC - Blockchain Evidence Management System

<p align="center">
  <a href="https://github.com/Gooichand/blockchain-evidence">
    <img src="assets/hero-banner.svg" alt="EVID-DGC Blockchain Evidence Management System" width="100%" max-width="1200">
  </a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=36BCF7&center=true&vCenter=true&width=800&lines=Secure+Blockchain+Evidence+Management;Role-Based+Access+Control;Immutable+Audit+Logs;Court-Ready+Verification" alt="Typing Animation">
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-Get_Started-36BCF7?style=for-the-badge&logo=rocket&logoColor=white" alt="Quick Start"></a>
  <a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-View_Diagram-7C4DFF?style=for-the-badge&logo=diagram&logoColor=white" alt="Architecture"></a>
  <a href="#-features"><img src="https://img.shields.io/badge/Features-Explore-00D4FF?style=for-the-badge&logo=star&logoColor=white" alt="Features"></a>
  <a href="#-documentation"><img src="https://img.shields.io/badge/Docs-Read_More-FF6B6B?style=for-the-badge&logo=book&logoColor=white" alt="Documentation"></a>
  <a href="https://blockchain-evidence.onrender.com"><img src="https://img.shields.io/badge/Live_Demo-Try_Now-00FF88?style=for-the-badge&logo=vercel&logoColor=black" alt="Live Demo"></a>
</p>

<p align="center">
  <img src="assets/badges/status-badges.svg" alt="Status Badges">
</p>

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🎯 Problem & Solution

<table>
<tr>
<td width="50%" valign="top">

### ❌ The Problem
Digital evidence management faces critical challenges:

| Challenge | Impact |
|-----------|--------|
| **Data Tampering** | Evidence integrity cannot be proven |
| **Broken Chain of Custody** | No verifiable audit trail |
| **Inconsistent Access Control** | Unauthorized access risks |
| **Centralized Storage** | Single point of failure |
| **Opaque Processes** | Judicial bodies cannot verify integrity |

</td>
<td width="50%" valign="top">

### ✅ The Solution
**EVID-DGC** leverages blockchain & decentralized storage:

| Innovation | Benefit |
|------------|---------|
| **Polygon Blockchain** | Immutable transaction proof |
| **IPFS via Pinata** | Decentralized, censorship-resistant storage |
| **SHA-256 Hashing** | Cryptographic file fingerprints |
| **8-Role RBAC** | Granular, auditable permissions |
| **Real-time Notifications** | Instant team awareness |
| **Dual Auth (Wallet + Email)** | Flexible, secure access |

</td>
</tr>
</table>

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🏗️ Architecture

<p align="center">
  <img src="https://github.com/Gooichand/blockchain-evidence/raw/main/assets/diagrams/architecture.svg" alt="System Architecture" width="100%" max-width="1200">
</p>

<details>
<summary><b>🔍 View Mermaid Source (Native GitHub Rendering)</b></summary>

```mermaid
flowchart TD
    subgraph Client["🌐 Client Layer"]
        Browser["🖥️ Web Browser\nHTML5 + Vanilla JS"]
        MetaMask["🦊 MetaMask Wallet\nEIP-1193 Provider"]
    end
    subgraph API["⚡ API Gateway\nExpress.js + Socket.IO"]
        Auth["🔐 Auth Service\nJWT + ECDSA"]
        RBAC["👥 RBAC Engine\n8-Role Hierarchy"]
    end
    subgraph Services["🔧 Core Services"]
        Evidence["📁 Evidence Service"]
        Blockchain["⛓️ Blockchain Service\nPolygon + Smart Contract"]
        IPFS["📦 IPFS Storage\nPinata + CID"]
    end
    subgraph Chain["⛓️ Blockchain Layer"]
        Contract["📜 EvidenceStorage.sol\n0x3945...D9e3"]
    end
    Browser --> API
    API --> Services
    Services --> Chain
```

</details>

### 📊 Technology Stack Maturity

```mermaid
quadrantChart
    title Technology Stack Maturity & Adoption
    x-axis Low Maturity --> High Maturity
    y-axis Low Adoption --> High Adoption
    quadrant-1 🚀 Production Ready
    quadrant-2 🔬 Cutting Edge
    "Node.js 20.19+"          : [0.95, 0.98]
    "Express.js"              : [0.95, 0.95]
    "PostgreSQL (Supabase)"   : [0.90, 0.92]
    "Ethers.js v6"            : [0.90, 0.93]
    "Polygon (Amoy/Mainnet)"  : [0.85, 0.88]
    "IPFS (Pinata)"           : [0.85, 0.82]
    "TensorFlow.js (AI)"      : [0.40, 0.30]
    "Zero-Knowledge (zk-SNARKs)": [0.30, 0.20]
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🚀 Project Status

<p align="center">
  <img src="assets/badges/phase1-complete.svg" alt="Phase 1 Complete">
  <img src="assets/badges/phase2-complete.svg" alt="Phase 2 Complete">
  <img src="assets/badges/phase3-progress.svg" alt="Phase 3 In Progress">
</p>

### Development Roadmap

```mermaid
gantt
    title EVID-DGC Development Roadmap
    dateFormat  YYYY-MM-DD
    axisFormat  %b %Y
    section Phase 1: Core System ✅
    Project Setup & Architecture          :done, p1-setup, 2024-01-15, 30d
    Database Schema & RLS Policies        :done, p1-db, 2024-02-01, 21d
    Authentication (Email + Wallet)       :done, p1-auth, 2024-02-15, 28d
    RBAC Implementation (8 Roles)         :done, p1-rbac, 2024-03-01, 21d
    Evidence CRUD & File Processing       :done, p1-evidence, 2024-03-15, 28d
    Case Management & Status Workflow     :done, p1-cases, 2024-04-01, 21d
    Admin Dashboard & User Management     :done, p1-admin, 2024-04-15, 21d
    Real-time Notifications (Socket.IO)   :done, p1-ws, 2024-05-10, 14d
    Production Deployment (Render)        :done, p1-deploy, 2024-06-01, 14d
    
    section Phase 2: Blockchain & IPFS ✅
    Smart Contract Development            :done, p2-contract, 2024-06-15, 30d
    Polygon Amoy Deployment               :done, p2-deploy, 2024-07-15, 14d
    Blockchain Service Integration        :done, p2-service, 2024-07-20, 21d
    IPFS/Pinata Integration               :done, p2-ipfs, 2024-08-01, 21d
    Hash Verification Pipeline            :done, p2-verify, 2024-08-15, 14d
    Advanced Rate Limiting                :done, p2-ratelimit, 2024-08-25, 10d
    System Monitoring & Health Checks     :done, p2-monitor, 2024-09-01, 14d
    
    section Phase 3: Advanced Forensics 🔄
    AI Deepfake Detection Engine          :active, p3-deepfake, 2024-10-01, 60d
    Advanced Metadata Forensics           :active, p3-meta, 2024-10-15, 45d
    Automated Verification Pipeline       :active, p3-auto, 2024-11-01, 45d
    Evidence Quality Scoring System       :p3-quality, 2024-11-15, 30d
    Legal Compliance Automation           :p3-compliance, 2024-12-01, 45d
    Court Integration & E-Discovery       :p3-court, 2025-01-15, 60d
    Multi-chain Support                   :p3-multichain, 2025-03-01, 60d
    Zero-Knowledge Proof Integration      :p3-zk, 2025-04-01, 60d
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## ✨ Core Features

<p align="center">
  <img src="assets/badges/features.svg" alt="Core Features">
</p>

### Phase 1: Core System (Production Ready)

| Feature | Description | Status |
|---------|-------------|--------|
| **8-Role RBAC** | Administrator, Investigator, Forensic Analyst, Legal Professional, Court Official, Evidence Manager, Auditor, Public Viewer | ✅ |
| **Dual Authentication** | MetaMask wallet (ECDSA) + Email/Password (bcrypt + JWT) | ✅ |
| **Admin Dashboard** | Full user management, role assignment, system configuration | ✅ |
| **Evidence Management** | Upload, watermark, compress, tag, verify, export | ✅ |
| **Case Lifecycle** | Draft → Open → Under Review → Court Ready → Closed/Archived | ✅ |
| **Audit Logging** | Immutable activity trails with IP, user agent, severity | ✅ |
| **Real-time WS** | Socket.IO notifications for uploads, verifications, assignments | ✅ |
| **Supabase + RLS** | PostgreSQL with Row Level Security policies | ✅ |

### Phase 2: Blockchain & IPFS (Production Ready)

| Feature | Description | Status |
|---------|-------------|--------|
| **Smart Contract** | `EvidenceStorage.sol` deployed to Polygon Amoy (`0x3945...D9e3`) | ✅ |
| **On-Chain Anchoring** | SHA-256 hash + metadata stored immutably | ✅ |
| **Gas Optimization** | Estimation, tracking, 2-block confirmation | ✅ |
| **IPFS Storage** | Pinata API, CID generation, gateway retrieval | ✅ |
| **Hash Verification** | `verifyHash()` against blockchain + IPFS content | ✅ |
| **Explorer Links** | Direct Polygonscan transaction/address URLs | ✅ |
| **Advanced Rate Limiting** | Blockchain: 10/min, Upload: 50/hr, Verify: 30/min | ✅ |
| **Health Monitoring** | Real-time blockchain, IPFS, database health checks | ✅ |

### Phase 3: Advanced Forensics (In Development)

| Feature | Description | Target |
|---------|-------------|--------|
| **AI Deepfake Detection** | TensorFlow.js + ONNX models for media authenticity | Q4 2024 |
| **Metadata Forensics** | EXIF, C2PA, hidden data extraction & analysis | Q4 2024 |
| **Auto Verification** | ML-powered evidence integrity scoring | Q1 2025 |
| **Quality Scoring** | Evidence reliability & completeness metrics | Q1 2025 |
| **Legal Compliance** | Automated GDPR, evidence retention, chain-of-custody | Q1 2025 |
| **Court Integration** | E-discovery APIs, digital exhibit packaging | Q2 2025 |
| **Multi-chain** | Ethereum, BSC, Arbitrum support | Q2 2025 |
| **Zero-Knowledge** | zk-SNARKs for private verification | Q3 2025 |

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🔐 Role-Based Access Control (8 Roles)

```mermaid
graph TD
    Admin[("🛡️ ADMINISTRATOR\nFull System Control")]
    Legal[("👨‍⚖️ LEGAL PROFESSIONAL\nCase Review & Certification")]
    Court[("🏛️ COURT OFFICIAL\nJudicial Oversight")]
    Manager[("📦 EVIDENCE MANAGER\nChain of Custody")]
    Auditor[("🔍 AUDITOR\nCompliance & Audit")]
    Analyst[("🔬 FORENSIC ANALYST\nTechnical Analysis")]
    Investigator[("🕵️ INVESTIGATOR\nEvidence Collection")]
    Viewer[("👁️ PUBLIC VIEWER\nRead-Only Access")]
    
    Admin -.-> Legal
    Admin -.-> Court
    Admin -.-> Manager
    Admin -.-> Auditor
    Admin -.-> Analyst
    Admin -.-> Investigator
    Admin -.-> Viewer
```

### Permission Matrix

| Permission | Admin | Legal | Court | Manager | Auditor | Analyst | Investigator | Viewer |
|------------|-------|-------|-------|---------|---------|---------|--------------|--------|
| Upload Evidence | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Download/Export | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Verify Hash | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Case | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Legal Hold | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Certify Evidence | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Court Actions | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Analysis | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## ⛓️ Blockchain Integration

### Smart Contract: `EvidenceStorage.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EvidenceStorage {
    struct Evidence {
        string fileHash;      // SHA-256
        string metadata;      // JSON string
        address uploadedBy;
        uint256 timestamp;
        bool isSealed;
    }
    
    mapping(uint256 => Evidence) public evidences;
    mapping(string => uint256) public hashToEvidenceId;
    mapping(address => bool) public authorizedUsers;
    
    event EvidenceStored(uint256 indexed evidenceId, string fileHash, address indexed uploadedBy);
    event EvidenceSealed(uint256 indexed evidenceId, address indexed sealedBy);
    
    function storeEvidence(string memory _fileHash, string memory _metadata) 
        public onlyAuthorized returns (uint256);
    function verifyHash(string memory _fileHash) public view returns (bool, uint256);
    function sealEvidence(uint256 _evidenceId) public onlyAuthorized;
}
```

**Deployed Address:** `0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3`  
**Network:** Polygon Amoy (Chain ID: 80002) / Mainnet (137)  
**Explorer:** [Polygonscan](https://amoy.polygonscan.com/address/0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3)

### Blockchain Transaction Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 User
    participant Frontend as 🌐 Frontend
    participant API as ⚡ Backend
    participant Contract as 📜 EvidenceStorage.sol
    participant Network as ⛓️ Polygon
    participant Explorer as 🔍 Polygonscan
    
    User->>Frontend: Upload Evidence + Metadata
    Frontend->>Frontend: Compute SHA-256 Hash
    Frontend->>User: Request Wallet Signature
    User->>Frontend: ✅ ECDSA Signature
    Frontend->>API: Submit Hash + Metadata + Sig
    API->>API: Verify Signature & Authorization
    API->>Contract: storeEvidence(hash, metadata)
    Contract->>Network: Mine Transaction
    Network->>Contract: Emit EvidenceStored Event
    Network-->>API: Tx Receipt (block#, gas)
    API->>Explorer: Auto-index
    API-->>Frontend: Verification Links
    Frontend-->>User: 🎉 Immutable Proof
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🌐 IPFS Decentralized Storage

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Pinning Service** | Pinata API | Reliable, redundant pinning |
| **Content Addressing** | IPFS CID v1 | Immutable content identifiers |
| **Gateway** | `gateway.pinata.cloud/ipfs/` | Fast public retrieval |
| **Metadata** | JSON + keyvalues | Searchable file attributes |

**Features:**
- ✅ Automatic pinning on upload
- ✅ CID validation (v0/v1 support)
- ✅ Pin status monitoring
- ✅ Duplicate detection
- ✅ Unpin capability for retention compliance
- ✅ Gateway fallback URLs

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 📦 3D Evidence Model

<p align="center">
  <a href="assets/evidence-cube.stl">
    <img src="https://img.shields.io/badge/3D_Model-View_STL-36BCF7?style=for-the-badge&logo=github&logoColor=white" alt="3D Model">
  </a>
</p>

Interactive 3D evidence cube (STL format) - viewable natively on GitHub:

```stl
solid evidence_blockchain_cube
  facet normal 0.0 0.0 1.0
    outer loop
      vertex 0.0 0.0 10.0
      vertex 10.0 0.0 10.0
      vertex 10.0 10.0 10.0
    endloop
  endfacet
  ... (12 facets forming a cube)
endsolid evidence_blockchain_cube
```

**Click the badge above or [view the STL file](assets/evidence-cube.stl) directly on GitHub** to rotate, zoom, and inspect the 3D model.

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🗄️ Database Schema (17+ Tables)

```mermaid
erDiagram
    USERS ||--o{ CASES : "creates"
    USERS ||--o{ EVIDENCE : "submits"
    CASES ||--o{ EVIDENCE : "contains"
    EVIDENCE ||--o{ EVIDENCE_TAGS : "tagged"
    TAGS ||--o{ EVIDENCE_TAGS : "applied"
    CASES ||--o{ CASE_STATUSES : "has"
    USERS ||--o{ ACTIVITY_LOGS : "generates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ADMIN_ACTIONS : "performs"
    LEGAL_HOLDS }|..|{ CASES : "applies"
    RETENTION_POLICIES ||--o{ EVIDENCE : "governs"
```

**Key Tables:**
- `users` — 8 roles, wallet/email auth, department, jurisdiction
- `evidence` — hash, IPFS CID, blockchain tx, block#, gas, seal status
- `cases` — status workflow, assignments, court dates, tags
- `activity_logs` — full audit trail with severity
- `admin_actions` — immutable admin operation log
- `notifications` — typed, expiring, real-time
- `tags` — hierarchical, categorizable, usage tracking

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## ⚡ Quick Start

### Prerequisites
- **Node.js** v20.19+ 
- **npm** or **yarn**
- **MetaMask** browser extension
- **Supabase** account
- **Pinata** account (for IPFS)
- **Alchemy/Polygon RPC** (for blockchain)

### 1. Clone & Install
```bash
git clone https://github.com/Gooichand/blockchain-evidence.git
cd blockchain-evidence
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

**Required Variables:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
JWT_SECRET=your_secure_secret
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3
PINATA_JWT=your_pinata_jwt
```

### 3. Database Setup
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create project → SQL Editor
3. Run `complete-database-setup-fixed.sql`

### 4. Deploy Smart Contract (Optional)
```bash
npm run compile
npm run deploy:amoy
# Update CONTRACT_ADDRESS in .env
```

### 5. Start Development
```bash
npm run dev
# Server at http://localhost:3000
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Linting
npm run lint
npm run format:check
```

**Test Coverage:**
- Health endpoints
- Signature verification middleware
- Authentication flows
- Rate limiting
- Blockchain integration

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [User Guide](docs/USER_GUIDE.md) | Role-specific workflows |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Architecture, APIs, contributing |
| [Security Guide](docs/SECURITY.md) | Threat model, best practices |
| [Deployment Guide](docs/DEPLOYMENT.md) | Render, Vercel, Netlify |
| [Maintenance Guide](docs/MAINTENANCE.md) | Backups, monitoring, updates |
| [API Reference](docs/swagger.js) | OpenAPI/Swagger documentation |

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🚀 Deployment

### Render.com (Recommended)
```yaml
# render.yaml (included)
services:
  - type: web
    name: evid-dgc
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=your_production_url
SUPABASE_KEY=your_production_key
# ... all other vars
```

### One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Gooichand/blockchain-evidence)

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Workflow
```bash
# Auto-regenerate diagrams on .mmd changes
# (Handled by GitHub Action)

# Run locally before PR
npm run lint:fix
npm run format
npm test
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 📄 License

**Apache License 2.0** — See [LICENSE](LICENSE) for details.

```
Copyright 2025 EVID-DGC Blockchain Evidence Management System

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🙏 Acknowledgments

| Project | Purpose |
|---------|---------|
| [Polygon](https://polygon.technology/) | Scalable Ethereum L2 |
| [Pinata](https://pinata.cloud/) | IPFS pinning service |
| [Supabase](https://supabase.com/) | PostgreSQL + Auth + Realtime |
| [Ethers.js](https://ethers.org/) | Ethereum library |
| [Mermaid](https://mermaid.js.org/) | Diagrams as code |
| [Waveify](https://waveify.up.railway.app/) | Animated SVG banners |
| [Lucide](https://lucide.dev/) | Beautiful icons |

---

<p align="center">
  <img src="assets/section-divider.svg" alt="Section Divider" width="100%">
</p>

<p align="center">
  <b>Built with ❤️ for Digital Forensic Integrity</b><br>
  <sub>Making evidence tamper-proof, verifiable, and court-ready</sub>
</p>

<p align="center">
  <a href="https://github.com/Gooichand/blockchain-evidence/stargazers">
    <img src="https://img.shields.io/github/stars/Gooichand/blockchain-evidence?style=social" alt="Stars">
  </a>
  <a href="https://github.com/Gooichand/blockchain-evidence/network/members">
    <img src="https://img.shields.io/github/forks/Gooichand/blockchain-evidence?style=social" alt="Forks">
  </a>
  <a href="https://github.com/Gooichand/blockchain-evidence/issues">
    <img src="https://img.shields.io/github/issues/Gooichand/blockchain-evidence?style=social" alt="Issues">
  </a>
</p>

<p align="center">
  <a href="#-evid-dgc---blockchain-evidence-management-system">⬆ Back to Top</a>
</p>