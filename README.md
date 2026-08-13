# EVID-DGC

## Blockchain Evidence and Digital Chain of Custody

EVID-DGC is an evidence-management prototype for recording digital-evidence metadata, generating file hashes, tracking custody events, and supporting public integrity verification.

> **Current status:** Experimental Polygon Amoy testnet prototype. Do not use this system for real legal evidence, production chain-of-custody records, or sensitive investigations until the security and operational controls have been independently verified.

[Live demo](https://blockchain-evidence.onrender.com) · [API reference](public/api-reference.html) · [Security policy](SECURITY.md) · [Deployment guide](docs/DEPLOYMENT.md)

## What the project does

The application is designed around an evidence lifecycle:

```text
Capture → Register → Hash → Store → Anchor → Verify → Transfer → Audit
```

The current prototype combines a Node.js and Express backend, static browser dashboards, Supabase/PostgreSQL data storage, optional Pinata IPFS pinning, Polygon Amoy blockchain anchoring, and Socket.IO notifications.

## Current status

| Area | Status | Notes |
|---|---|---|
| Public evidence verification | Prototype available | Public users can verify supported evidence identifiers and hashes. |
| Email authentication | Available for development/testing | Role-specific access requires further security hardening. |
| Wallet authentication | Available where configured | Requires a compatible wallet and Polygon Amoy configuration. |
| Evidence lifecycle | Prototype available | Upload, metadata, verification, custody, and audit workflows are under active development. |
| Blockchain anchoring | Polygon Amoy testnet | The deployed contract is not a production/mainnet deployment. |
| IPFS storage | Optional integration | Availability depends on Pinata configuration and pin retention. |
| Forensic analysis | Prototype / development | Hash analysis and related tools are not a substitute for a validated forensic workflow. |
| 3D evidence viewer | Prototype | The viewer currently demonstrates an included STL asset. |
| AI-assisted analysis | Research / planned | Not a production capability. |
| Mainnet deployment | Planned | Mainnet use requires a separate security, legal, operational, and smart-contract review. |

## Important limitations

The project currently uses the Polygon Amoy testnet. Testnet records are not production evidence records and must not be treated as legally authoritative.

IPFS pinning does not automatically guarantee permanent availability. A production deployment would need verified pin retention, independent backups, recovery procedures, access controls, and an operational owner for the storage account.

The authorization model is under active hardening. Frontend navigation controls must not be treated as a security boundary. Every protected page, API endpoint, and evidence object must enforce authentication, role permissions, and object-level access on the server.

## Technology

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | HTML, CSS, and browser JavaScript |
| Database | Supabase/PostgreSQL |
| Authentication | Email authentication and optional wallet authentication |
| Blockchain | Solidity, ethers.js, Polygon Amoy |
| Storage | Optional Pinata IPFS integration |
| Realtime updates | Socket.IO |
| Testing | Jest, SuperTest, Hardhat tooling |
| Deployment | Render-compatible Node.js service |

## Roles and permissions

The application contains role-specific workflows. The exact role names and permissions must remain synchronized across the database, authentication tokens, backend middleware, frontend routes, seed data, and documentation.

| Role | Intended responsibility |
|---|---|
| Public Viewer | Verify publicly available evidence integrity information. |
| Investigator / Officer | Capture cases, register evidence, and work with assigned case data. |
| Forensic Analyst | Perform forensic and hash analysis on permitted evidence. |
| Legal Professional | Review legal materials and prepare legal opinions or filings. |
| Court Official | Review court-related evidence and court workflows. |
| Evidence Manager | Manage intake, inventory, retention, custody, and disposal workflows. |
| Auditor | Review audit trails, compliance information, and system integrity indicators. |
| Administrator | Manage users, roles, system configuration, and privileged operations. |

These descriptions are intended to explain the product model. The backend permission matrix is the authoritative source of access decisions.

## Evidence integrity model

The system can associate an evidence record with a file hash, metadata, storage reference, custody events, and blockchain transaction information.

A production implementation must define one canonical hash pipeline and test it end to end:

```text
Original file
  → browser or server hash generation
  → stored file hash
  → optional IPFS content reference
  → blockchain anchor
  → independent verification
```

The selected hashing algorithms, encoding rules, timestamp rules, and canonical metadata format must be documented in the API and security documentation. A testnet transaction or hash comparison alone does not establish legal admissibility.

## Local development

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
```

### Configure environment variables

Copy the environment template and provide only the values required for the features you intend to run:

```bash
cp .env.example .env
```

At minimum, configure the database and server values. Blockchain, IPFS, SMTP, Redis, and encryption settings are optional only when the related features are disabled.

Never commit `.env`, private keys, JWT secrets, SMTP passwords, Pinata credentials, or production database credentials.

### Initialize the database

Use the SQL setup and migration files appropriate to your environment. Review them before applying them to a production database. Local seed users must never be reused in production.

### Start the application

```bash
npm run dev
```

The default development server is expected at `http://localhost:10000` when the configured port is 10000. Check the configured `PORT` value if the server starts on another port.

### Health check

```bash
npm run health
```

You can also open `/api/health` directly after the server starts.

## Available commands

| Command | Purpose |
|---|---|
| `npm start` | Start the production-style Node.js server. |
| `npm run dev` | Start the server with Nodemon. |
| `npm test` | Run the Jest test suite. |
| `npm run test:integration` | Run the repository integration test script. |
| `npm run lint` | Run ESLint. |
| `npm run lint:fix` | Apply ESLint fixes where safe. |
| `npm run format:check` | Check Prettier formatting. |
| `npm run compile` | Compile the Solidity contracts with Hardhat. |
| `npm run health` | Check the local health endpoint. |

Only commands defined in `package.json` should be added to this table. Add an end-to-end test command only after the test runner and configuration are committed and verified.

## Security expectations

The security boundary is the backend, not the browser interface. Protected operations must:

1. Authenticate the request using a verified session or token.
2. Resolve the current user and role from trusted server-side data.
3. Check the required permission for the requested operation.
4. Check object-level ownership, case membership, or assignment where applicable.
5. Return `401 Unauthorized` for missing or invalid authentication.
6. Return `403 Forbidden` for authenticated users without permission.
7. Avoid returning privileged data in error responses.
8. Record security-sensitive actions in an auditable log.

Review [SECURITY.md](SECURITY.md) before reporting a vulnerability. Do not use the public demo for unauthorized testing or real evidence.

## Documentation

- [Deployment guide](docs/DEPLOYMENT.md)
- [Developer guide](docs/DEVELOPER_GUIDE.md)
- [User guide](docs/USER_GUIDE.md)
- [Maintenance guide](docs/MAINTENANCE.md)
- [Security policy](docs/SECURITY.md)
- [API reference](public/api-reference.html)
- [Project phases](PHASES.md)
- [Contributing guide](CONTRIBUTING.md)
- [Code of conduct](CODE_OF_CONDUCT.md)

## Contributing

Before opening a pull request:

```bash
npm test
npm run lint
npm run format:check
```

Security-sensitive changes should include negative authorization tests for every affected role and endpoint. Do not include credentials, private keys, production data, or generated build artifacts in commits.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

## Contact

For security issues, follow the responsible-disclosure process in [SECURITY.md](SECURITY.md). For general project questions, use the repository issue tracker or the project contact channel.
