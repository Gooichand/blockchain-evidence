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
        RBAC["👥 RBAC Engine\n8-Role Hierarchy + ABAC"]
    end
    subgraph Services["🔧 Core Services"]
        Evidence["📁 Evidence Service"]
        Cases["📋 Case Management"]
        Audit["📝 Audit Trail"]
        Blockchain["⛓️ Blockchain Service\nPolygon + Smart Contract"]
        IPFS["📦 IPFS Storage\nPinata + CID"]
    end
    subgraph Chain["⛓️ Blockchain Layer"]
        Contract["📜 EvidenceStorage.sol\n0x3945...D9e3"]
    end
    subgraph Storage["🗄️ Data Layer"]
        Database["🐘 PostgreSQL\nSupabase + RLS"]
    end
    subgraph Realtime["🔔 Cross-Cutting"]
        SocketIO["📡 Socket.IO\nReal-time Notifications"]
    end

    Browser --> API
    MetaMask --> Browser
    API --> Auth
    API --> RBAC
    API --> Evidence
    API --> Cases
    API --> Audit
    Evidence --> Blockchain
    Evidence --> IPFS
    Blockchain --> Contract
    Evidence --> Database
    Cases --> Database
    Audit --> Database
    SocketIO -.-> Evidence
    SocketIO -.-> Cases
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
    quadrant-3 🧪 Experimental
    "Node.js 20.19+"          : [0.95, 0.98]
    "Express.js"              : [0.95, 0.95]
    "PostgreSQL (Supabase)"   : [0.90, 0.92]
    "Ethers.js v6"            : [0.90, 0.93]
    "Polygon (Amoy)"          : [0.85, 0.88]
    "IPFS (Pinata)"           : [0.85, 0.82]
    "TensorFlow.js (AI)"      : [0.25, 0.20]
    "Zero-Knowledge (zk-SNARKs)": [0.15, 0.10]
```

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🚀 Project Status

### Current Status (August 2026)

| Area | Status | Notes |
|------|--------|-------|
| Core Platform | ✅ Stable | Auth, RBAC, cases, evidence, audit trail — all operational |
| Blockchain Evidence | ✅ Implemented | Polygon Amoy testnet only — contract deployed and verified |
| IPFS Storage | ✅ Implemented | Pinata pinning, CID validation, gateway retrieval |
| 8-Role RBAC | ✅ Implemented | Administrator, Investigator, Analyst, Legal, Court, Manager, Auditor, Public Viewer |
| Audit Trail | ✅ Implemented | Immutable activity logging with severity levels |
| Real-time Notifications | ✅ Implemented | Socket.IO for uploads, verifications, assignments |
| Forensic Lab (UI) | ✅ Implemented | 11 categories, 59 tools — UI framework with placeholder engines |
| Advanced Forensics | 🟡 In Development | AI deepfake detection, metadata forensics, automated verification — UI scaffolds exist, backend engines pending |
| Interactive 3D Viewer | 🔵 Planned | Currently an STL file download — web-based Three.js viewer planned |
| Court Integration | 🔵 Planned | E-discovery APIs, digital exhibit packaging |
| Multi-chain Support | 🔵 Planned | Ethereum, BSC, Arbitrum |
| Zero-Knowledge Proofs | 🔬 Research | zk-SNARKs for private verification |

### What This Means

- **Phase 1 (Core System)** and **Phase 2 (Blockchain & IPFS)** are complete and deployed to production.
- **Phase 3 (Advanced Forensics)** is partially implemented — the UI framework exists (`forensic-lab.js`) with 59 tool stubs, but the actual forensic engines are placeholder implementations. AI/ML models are not yet integrated.
- **Blockchain deployment is Polygon Amoy testnet only.** Mainnet deployment is not yet active.
- The system has **43 HTML pages** across 8 role-specific dashboards plus shared pages (cases, evidence, audit trail, settings, etc.).

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

### Phase 2: Blockchain & IPFS (Production Ready — Amoy Testnet)

| Feature | Description | Status |
|---------|-------------|--------|
| **Smart Contract** | `EvidenceStorage.sol` deployed to Polygon Amoy (`0x3945...D9e3`) | ✅ Amoy |
| **On-Chain Anchoring** | SHA-256 hash + metadata stored immutably | ✅ |
| **Gas Optimization** | Estimation, tracking, 2-block confirmation | ✅ |
| **IPFS Storage** | Pinata API, CID generation, gateway retrieval | ✅ |
| **Hash Verification** | `verifyHash()` against blockchain + IPFS content | ✅ |
| **Explorer Links** | Direct Polygonscan transaction/address URLs | ✅ |
| **Advanced Rate Limiting** | Blockchain: 10/min, Upload: 50/hr, Verify: 30/min | ✅ |
| **Health Monitoring** | Real-time blockchain, IPFS, database health checks | ✅ |

> **Network Note:** All blockchain features are deployed on the **Polygon Amoy testnet** (Chain ID: 80002). Mainnet deployment (Chain ID: 137) is planned for a future release.

### Phase 3: Advanced Forensics (In Development)

| Feature | Description | Status |
|---------|-------------|--------|
| **Forensic Lab UI** | 11 categories, 59 analysis tools — complete UI framework | ✅ UI |
| **Hash & Integrity** | SHA-256, hash comparison, file integrity checking | ✅ |
| **Image Forensics** | ELA, clone detection, noise analysis, metadata viewer | 🔵 Placeholder |
| **Document Forensics** | PDF inspector, metadata viewer, OCR engine | 🔵 Placeholder |
| **Video Forensics** | Metadata viewer, frame extraction, timeline viewer | 🔵 Placeholder |
| **Audio Forensics** | Waveform viewer, spectrogram, audio fingerprinting | 🔵 Placeholder |
| **Blockchain Verification** | Transaction verification, evidence anchoring, chain of custody | ✅ |
| **Metadata Extraction** | EXIF, GPS, camera metadata, container metadata | 🔵 Placeholder |
| **AI Deepfake Detection** | TensorFlow.js + ONNX models for media authenticity | 🔬 Research |
| **C2PA Content Credentials** | Content provenance and authenticity metadata | 🔬 Research |
| **Zero-Knowledge Proofs** | zk-SNARKs for private verification | 🔬 Research |

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 🔐 Role-Based Access Control (8 Roles)

```mermaid
flowchart TD
    EVID["EVID-DGC Authorization System"]
    EVID --> RBAC
    EVID --> ABAC

    RBAC["RBAC\nRole-Based Access Control"]
    ABAC["ABAC\nAttribute-Based Access Control"]

    RBAC --> Roles

    subgraph Roles["Role Hierarchy"]
        Admin["🛡️ Administrator\nFull System Control"]
        Legal["👨‍⚖️ Legal Professional\nCase Review & Certification"]
        Court["🏛️ Court Official\nJudicial Oversight"]
        Manager["📦 Evidence Manager\nChain of Custody"]
        Auditor["🔍 Auditor\nCompliance & Audit"]
        Analyst["🔬 Forensic Analyst\nTechnical Analysis"]
        Investigator["🕵️ Investigator\nEvidence Collection"]
        Viewer["👁️ Public Viewer\nRead-Only Verification"]
    end

    ABAC --> Attrs["Context / Policy Attributes"]
    Attrs --> Jurisdiction["Jurisdiction"]
    Attrs --> CaseAssignment["Case Assignment"]
    Attrs --> EvidenceStatus["Evidence Status"]
    Attrs --> LegalHold["Legal Hold"]
    Attrs --> Clearance["Clearance Level"]
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
**Network:** Polygon Amoy Testnet (Chain ID: 80002)  
**Explorer:** [Polygonscan (Amoy)](https://amoy.polygonscan.com/address/0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3)

> **Current Deployment Status:**
> - **Polygon Amoy (Chain ID: 80002)** — ✅ Deployed and verified
> - **Polygon Mainnet (Chain ID: 137)** — 🔵 Not yet deployed
>
> The contract is deployed on the Amoy testnet only. Mainnet deployment requires a separate deployment step and will incur real gas fees.

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

## 📋 Evidence Workflow

The complete evidence lifecycle in EVID-DGC:

```mermaid
flowchart LR
    A["📥 COLLECT"] --> B["📋 REGISTER"]
    B --> C["🔐 HASH"]
    C --> D["📦 STORE"]
    D --> E["⛓️ ANCHOR"]
    E --> F["✅ VERIFY"]
    F --> G["🔬 ANALYZE"]
    G --> H["⚖️ REVIEW"]
    H --> I["🏛️ CERTIFY"]
    I --> J["📜 COURT"]
    J --> K["🗄️ ARCHIVE"]

    style A fill:#10b981,color:#fff
    style B fill:#3b82f6,color:#fff
    style C fill:#8b5cf6,color:#fff
    style D fill:#06b6d4,color:#fff
    style E fill:#f59e0b,color:#fff
    style F fill:#10b981,color:#fff
    style G fill:#ec4899,color:#fff
    style H fill:#3b82f6,color:#fff
    style I fill:#8b5cf6,color:#fff
    style J fill:#ef4444,color:#fff
    style K fill:#6b7280,color:#fff
```

| Step | Action | Actor | System |
|------|--------|-------|--------|
| 📥 Collect | Gather physical/digital evidence | Investigator | Frontend |
| 📋 Register | Create evidence record with metadata | Investigator | Frontend + API |
| 🔐 HASH | Compute SHA-256 hash | System | Frontend (Web Crypto) |
| 📦 STORE | Upload to IPFS via Pinata | System | IPFS Service |
| ⛓️ ANCHOR | Store hash on Polygon blockchain | System | Smart Contract |
| ✅ VERIFY | Validate hash against blockchain + IPFS | Any authorized user | API |
| 🔬 ANALYZE | Forensic examination and findings | Forensic Analyst | Forensic Lab |
| ⚖️ REVIEW | Legal review and assessment | Legal Professional | Frontend |
| 🏛️ CERTIFY | Court-ready certification | Court Official | Frontend |
| 📜 COURT | Submit for judicial proceedings | Court Official | Frontend |
| 🗄️ ARCHIVE | Long-term retention with legal hold | Evidence Manager | API |

---

<img src="assets/section-divider.svg" alt="Section Divider" width="100%">

## 📦 3D Evidence Model

<p align="center">
  <a href="assets/evidence-cube.stl">
    <img src="https://img.shields.io/badge/3D_Model-Download_STL-36BCF7?style=for-the-badge&logo=github&logoColor=white" alt="3D Model">
  </a>
</p>

The evidence cube concept is available as an **STL file** for external 3D viewing:

- [View STL file on GitHub](assets/evidence-cube.stl) — rotate, zoom, and inspect natively in the browser
- [Download STL](assets/evidence-cube.stl) — open in any 3D viewer (Blender, MeshLab, etc.)

> **Note:** This is a static 3D model representing the evidence blockchain concept. An interactive web-based **3D Evidence Integrity Viewer** (Three.js) with mouse/touch rotation, zoom, and real-time evidence status indicators is planned for a future release.

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

### End-to-End Workflow Tests (Planned)

| Role | Workflow | Status |
|------|----------|--------|
| **Investigator** | Login → Create case → Upload evidence → SHA-256 → IPFS → Blockchain anchor → Evidence appears | 🔵 Planned |
| **Analyst** | Login → Open assigned evidence → Analyze → Add findings → Verify hash → Submit analysis | 🔵 Planned |
| **Legal** | Open case → Review evidence → Review custody → Verify integrity → Certify | 🔵 Planned |
| **Court** | Open case → Review evidence → Verify blockchain proof → View chain of custody → Generate report | 🔵 Planned |
| **Public** | Open public evidence → Enter verification ID/hash → Verify → Blockchain proof | 🔵 Planned |

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
Copyright 2025-2026 EVID-DGC Blockchain Evidence Management System

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