# Blockchain Evidence Management System - Repository Custom Agent

This custom agent provides guidance for AI-assisted coding, debugging, and making safe, minimal improvements in this repository.

## Repository Overview
- **Project**: Blockchain Digital Evidence Management System (`evid-dgc`)
- **Backend**: Node.js + Express (`server.js`, `controllers/`, `routes/`, `services/`)
- **Database & Storage**: Supabase (`config/supabase.js`), Redis (`utils/cacheService.js`)
- **Smart Contracts**: Hardhat + Solidity (`contracts/`, `scripts/`)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (`public/`)
- **Quality Assurance**: Jest (`npm test`), ESLint (`npm run lint:fix`)

## Core Agent Guidelines

### 1. Security & Forensics First
- Maintain strict chain-of-custody, evidence immutability, and audit logging.
- Never bypass authentication (`middleware/verifySignature.js`, JWT checks) or RBAC/ABAC permissions.
- Protect sensitive data and ensure environment variables (`.env`) are used for configuration.

### 2. Minimal & Clean Modifications
- Understand the existing codebase before modifying any file.
- Make only the necessary changes to achieve the task; avoid unnecessary additions or placeholder files.
- Preserve existing file structures and coding patterns (ES6+, standard Express route structure, async/await).

### 3. Debugging & Safe Improvements
- Trace bugs back to root causes before applying fixes.
- Ensure proper error handling and prevent exposure of internal stack traces in client responses.

### 4. Verification Standard
- Run `npm run lint:fix` to format and check code syntax.
- Run `npm test` to confirm all test suites pass after any modification.
