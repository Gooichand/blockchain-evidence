<div align="center">

<img src="assets/hero-banner.svg" alt="EVID-DGC blockchain evidence platform" width="100%">

# EVID-DGC

### Evidence integrity, custody visibility, and verifiable digital records.

<p>
  <a href="https://blockchain-evidence.onrender.com"><img src="https://img.shields.io/badge/LIVE_DEMO-OPEN-DC2626?style=for-the-badge&logo=render&logoColor=white" alt="Open live demo"></a>
  <a href="public/api-reference.html"><img src="https://img.shields.io/badge/API-REFERENCE-2563EB?style=for-the-badge&logo=swagger&logoColor=white" alt="API reference"></a>
  <a href="docs/DEPLOYMENT.md"><img src="https://img.shields.io/badge/DEPLOY-RENDER-111827?style=for-the-badge&logo=render&logoColor=white" alt="Deployment guide"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/STATUS-TESTNET_PROTOTYPE-F59E0B?style=flat-square" alt="Testnet prototype">
  <img src="https://img.shields.io/badge/CHAIN-POLYGON_AMOY-8247E5?style=flat-square&logo=polygon&logoColor=white" alt="Polygon Amoy">
  <img src="https://img.shields.io/badge/BACKEND-NODE_%2B_EXPRESS-16A34A?style=flat-square&logo=node.js&logoColor=white" alt="Node and Express">
  <img src="https://img.shields.io/badge/DATA-SUPABASE-3ECF8E?style=flat-square&logo=supabase&logoColor=111827" alt="Supabase">
  <img src="https://img.shields.io/badge/STORAGE-IPFS_/_PINATA-7C3AED?style=flat-square&logo=ipfs&logoColor=white" alt="IPFS and Pinata">
</p>

</div>

> [!WARNING]
> **This is an experimental Polygon Amoy testnet prototype.** Do not use it for real legal evidence, production chain-of-custody records, or sensitive investigations until the authorization, audit, backup, and operational controls have been independently verified.

<div align="center">

[Product overview](#-the-product) · [Workflow](#-the-3d-evidence-flow) · [Quick start](#-quick-start) · [Security](#-security-first) · [Documentation](#-documentation)

</div>

## ◈ The product

EVID-DGC is a digital evidence-management prototype that connects file hashing, case metadata, custody events, optional IPFS storage, and Polygon Amoy anchoring into one traceable workflow.

The goal is simple: make it easier to answer **what was captured, who handled it, whether it changed, and which record was verified**.

### What it brings together

<table>
<tr>
<td width="25%" valign="top">
<h3>01 · Capture</h3>
Register evidence with case metadata, descriptions, actors, and collection context.
</td>
<td width="25%" valign="top">
<h3>02 · Fingerprint</h3>
Generate and compare file hashes to detect unexpected changes.
</td>
<td width="25%" valign="top">
<h3>03 · Anchor</h3>
Associate integrity metadata with a Polygon Amoy transaction when blockchain integration is enabled.
</td>
<td width="25%" valign="top">
<h3>04 · Verify</h3>
Review evidence integrity, custody history, and audit information through role-specific workflows.
</td>
</tr>
</table>

## ◈ The 3D evidence flow

The interface is designed around a layered chain-of-custody journey. Each stage adds context without replacing the original evidence or its audit trail.

```text
                         ┌──────────────────────────┐
                         │  06  VERIFY              │
                         │  Independent comparison  │
                         └────────────┬─────────────┘
                                      │
                   ┌──────────────────▼──────────────────┐
                   │  05  AUDIT                           │
                   │  Custody events · actors · timestamps│
                   └──────────────────┬──────────────────┘
                                      │
          ┌───────────────────────────▼───────────────────────────┐
          │  04  ANCHOR                                            │
          │  Polygon Amoy transaction · evidence integrity record  │
          └───────────────────────────┬───────────────────────────┘
                                      │
                ┌─────────────────────▼─────────────────────┐
                │  03  STORE                                │
                │  Database metadata · optional IPFS pin    │
                └─────────────────────┬─────────────────────┘
                                      │
      ┌───────────────────────────────▼───────────────────────────────┐
      │  02  FINGERPRINT                                               │
      │  Canonical file hash · metadata normalization · comparison      │
      └───────────────────────────────┬───────────────────────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │  01  CAPTURE             │
                         │  File + case context    │
                         └─────────────────────────┘
```

A production implementation must define one canonical hashing pipeline and test it end to end. The selected algorithm, encoding, timestamp, metadata, and verification rules must remain consistent between browser, server, database, storage, and chain.

## ◈ Current status

<table>
<tr>
<td width="33%" valign="top">
<h3><font color="#16A34A">AVAILABLE</font></h3>

Public verification flows, static dashboards, email authentication, case and evidence prototypes, audit views, and development tooling.
</td>
<td width="33%" valign="top">
<h3><font color="#F59E0B">IN DEVELOPMENT</font></h3>

Forensic analysis, 3D evidence viewing, advanced custody workflows, operational reliability, and stronger authorization coverage.
</td>
<td width="33%" valign="top">
<h3><font color="#7C3AED">PLANNED</font></h3>

AI-assisted analysis, validated forensic reporting, mainnet deployment, recovery operations, and production compliance work.
</td>
</tr>
</table>

| Capability | Current state |
|---|---|
| Public evidence verification | Prototype available |
| Email and wallet authentication | Available where configured |
| Evidence lifecycle | Prototype / active development |
| Blockchain anchoring | Polygon Amoy testnet |
| IPFS storage | Optional Pinata integration |
| Forensic analysis | Prototype / development |
| 3D evidence viewer | Prototype |
| AI-assisted analysis | Research / planned |
| Mainnet deployment | Planned |

## ◈ Technology stack

<table>
<tr>
<td><strong>Backend</strong><br>Node.js · Express.js</td>
<td><strong>Frontend</strong><br>HTML · CSS · Browser JavaScript</td>
<td><strong>Data</strong><br>Supabase · PostgreSQL</td>
</tr>
<tr>
<td><strong>Chain</strong><br>Solidity · ethers.js · Polygon Amoy</td>
<td><strong>Storage</strong><br>Pinata · IPFS integration</td>
<td><strong>Realtime</strong><br>Socket.IO</td>
</tr>
</table>

## ◈ Roles and access model

The backend permission matrix is the authority for access decisions. Frontend navigation is only a usability layer and must never be treated as security.

| Role | Intended responsibility |
|---|---|
| **Public Viewer** | Verify publicly available integrity information. |
| **Investigator / Officer** | Capture cases, register evidence, and work with assigned case data. |
| **Forensic Analyst** | Perform forensic and hash analysis on permitted evidence. |
| **Legal Professional** | Review legal materials and prepare legal opinions or filings. |
| **Court Official** | Review court-related evidence and court workflows. |
| **Evidence Manager** | Manage intake, inventory, retention, custody, and disposal workflows. |
| **Auditor** | Review audit trails, compliance information, and system integrity indicators. |
| **Administrator** | Manage users, roles, system configuration, and privileged operations. |

Role names and permissions must remain synchronized across database records, authentication tokens, server middleware, frontend routes, seed data, tests, and documentation.

## ◈ Quick start

### Prerequisites

- Node.js 20.19 or later, or Node.js 22 or later
- npm
- A Supabase project or compatible PostgreSQL environment
- Optional: Pinata account for IPFS integration
- Optional: Polygon Amoy wallet and RPC access for blockchain testing

### Install

```bash
git clone https://github.com/Gooichand/blockchain-evidence.git
cd blockchain-evidence
npm install
cp .env.example .env
```

Configure only the services you intend to use. Never commit `.env`, private keys, JWT secrets, SMTP passwords, Pinata credentials, or production database credentials.

### Start locally

```bash
npm run dev
```

The development server is expected at `http://localhost:10000` when `PORT=10000` is configured. Check the configured port if the server starts elsewhere.

### Check health

```bash
npm run health
```

You can also open `/api/health` directly after the server starts.

## ◈ Available commands

| Command | Purpose |
|---|---|
| `npm start` | Start the production-style Node.js server. |
| `npm run dev` | Start the server with Nodemon. |
| `npm test` | Run the Jest test suite. |
| `npm run test:integration` | Run the repository integration test script. |
| `npm run lint` | Run ESLint. |
| `npm run format:check` | Check Prettier formatting. |
| `npm run compile` | Compile Solidity contracts with Hardhat. |
| `npm run health` | Check the local health endpoint. |

## ◈ Security first

The security boundary is the backend. Protected pages, APIs, and evidence objects must enforce authentication, role permissions, and object-level access on the server.

A protected operation should:

1. Verify a valid session or token.
2. Resolve the current user and role from trusted server-side data.
3. Check the required permission.
4. Check case, evidence, ownership, assignment, or team context where applicable.
5. Return `401 Unauthorized` for missing or invalid authentication.
6. Return `403 Forbidden` for authenticated users without permission.
7. Avoid exposing privileged data in error responses.
8. Record security-sensitive activity in an auditable log.

Read the [security policy](SECURITY.md) before reporting a vulnerability. Do not use the public demo for unauthorized testing or real evidence.

## ◈ Documentation

<table>
<tr>
<td><a href="docs/DEPLOYMENT.md"><strong>Deployment</strong></a><br>Render, database, environment, and operations.</td>
<td><a href="docs/DEVELOPER_GUIDE.md"><strong>Developer guide</strong></a><br>Repository structure and development notes.</td>
<td><a href="docs/USER_GUIDE.md"><strong>User guide</strong></a><br>Application workflows and role usage.</td>
</tr>
<tr>
<td><a href="docs/SECURITY.md"><strong>Security</strong></a><br>Scope, reporting, and security expectations.</td>
<td><a href="public/api-reference.html"><strong>API reference</strong></a><br>Interactive endpoint documentation.</td>
<td><a href="PHASES.md"><strong>Project phases</strong></a><br>Roadmap and implementation status.</td>
</tr>
</table>

Additional project guidance is available in [MAINTENANCE.md](docs/MAINTENANCE.md), [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [LICENSE](LICENSE).

## ◈ Contributing

Before opening a pull request, run the checks that are defined in `package.json`:

```bash
npm test
npm run lint
npm run format:check
```

Security-sensitive changes should include negative authorization tests for every affected role and endpoint. Do not include credentials, private keys, production data, or generated build artifacts in commits.

## ◈ License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

<div align="center">

<img src="assets/section-divider.svg" alt="EVID-DGC section divider" width="82%">

### EVID-DGC · Trace the record. Verify the evidence. Respect the chain.

<a href="https://github.com/Gooichand/blockchain-evidence">GitHub</a> · <a href="https://blockchain-evidence.onrender.com">Live demo</a> · <a href="SECURITY.md">Security policy</a>

</div>
