# 🔐 EVID-DGC - Blockchain Evidence Management System

**Secure admin-controlled evidence management system with role-based access control.**

> ## 🚀 **PROJECT STATUS**
> ### ✅ **PHASE 1: COMPLETE** - Core System Operational
> - 8-Role RBAC System ✅
> - Dual Authentication (MetaMask + Email) ✅
> - Admin Dashboard & User Management ✅
> - Evidence Upload/Download System ✅
> - Database Security (RLS) ✅
> - Real-time Notifications ✅
> - Complete Documentation ✅
>
> ### 🔄 **PHASE 2: IN PROGRESS** - Blockchain Integration
> #### Phase 2 Primary Objectives:
> - 1. TRUE BLOCKCHAIN INTEGRATION 🔗
> - 2. FIX ALL PHASE 1 ISSUES 🔧
> - 3. IMPLEMENT IPFS STORAGE 📦
> - 4. MODERN UI/UX UPGRADE 🎨
> - 5. ADVANCED SECURITY 🔒
> - 6. PERFORMANCE OPTIMIZATION ⚡

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Render-blue)](https://render.com/)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/11669/badge)](https://www.bestpractices.dev/projects/11669)


<div align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">
</div>

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=25&pause=1000&color=36BCF7&center=true&vCenter=true&width=600&lines=Welcome+to+EVID-DGC;Secure+Blockchain+Evidence+Management;Role-Based+Access+Control;Immutable+Audit+Logs" alt="Typing SVG" />
</div>



---

## ❓ Problem & Solution

### Problem Statement
Digital evidence management often faces challenges like data tampering, lack of a verifiable chain of custody, and inconsistent access control. Traditional systems can be opaque, making it difficult for judicial and investigative bodies to trust the integrity of digital artifacts.

### Solution Overview
**EVID-DGC** addresses these issues by leveraging blockchain-inspired principles and robust role-based access control. By utilizing a secure Supabase backend and providing immutable audit logs, the system ensures that every action—from evidence upload to court review—is tracked and verifiable, maintaining the highest standards of digital forensic integrity.

---
## ✨ Working Features

### Core System (Production Ready)
- ✅ **8-Role RBAC** - Complete role-based access control
- ✅ **Dual Authentication** - MetaMask wallet + Email/Password
- ✅ **Admin Dashboard** - Full user management interface
- ✅ **Evidence Upload** - Multi-format file support (PDF, images, videos, audio)
- ✅ **Database Security** - Supabase PostgreSQL with Row Level Security
- ✅ **Real-time Notifications** - Socket.IO WebSocket integration
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **File Processing** - Watermarking and compression
- ✅ **Case Management** - Full case lifecycle with status tracking
- ✅ **Export System** - Evidence download with watermarks

### Security Features
- ✅ **Password Hashing** - SHA-256 with salt
- ✅ **Rate Limiting** - API protection
- ✅ **Input Validation** - XSS and injection prevention
- ✅ **CORS Protection** - Cross-origin security
- ✅ **Session Management** - Secure user sessions

### Development Features
- ✅ **Test Account System** - Automated test user creation
- ✅ **Role Testing** - Easy role switching for development
- ✅ **Health Monitoring** - System health endpoints
- ✅ **Error Handling** - Comprehensive error management



---

## 🛠️ Technical Info

### Tech Stack (Currently Implemented)

| Category | Technologies | Status |
|----------|-------------|--------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Socket.IO Client | ✅ Working |
| **Backend** | Node.js v16+, Express.js, Socket.IO (Real-time) | ✅ Working |
| **Database** | Supabase (PostgreSQL with Row Level Security) | ✅ Working |
| **Authentication** | MetaMask/Web3, Email/Password | ✅ Working |
| **File Processing** | Multer, Sharp, PDF-Lib | ✅ Working |
| **Icons & UI** | Lucide Icons, Custom CSS | ✅ Working |
| **Hosting** | Render, Vercel, Netlify Compatible | ✅ Working |
| **Smart Contracts** | Solidity (Code Ready) | ⚠️ Phase 2 |
| **Storage** | Local/Database (IPFS Planned) | ⚠️ Phase 2 |
| **Blockchain** | Polygon Network (Configured) | ⚠️ Phase 2 |

### User Roles
The system implements 8 distinct roles to ensure strict access control:
1. **Public Viewer**: Browse public case information.
2. **Investigator**: Handle case creation and evidence uploads.
3. **Forensic Analyst**: Perform technical analysis and generate reports.
4. **Legal Professional**: Conduct legal reviews of cases and evidence.
5. **Court Official**: Manage judicial proceedings and scheduling.
6. **Evidence Manager**: Maintain the chain of custody and storage integrity.
7. **Auditor**: Oversee system compliance and review audit logs.
8. **Administrator**: Full system oversight, user management, and configuration.

---

## 📁 Folder Structure

```text
├── contracts/                          # Smart contract files
│   └── EvidenceStorage.sol             # Main evidence storage contract
├── docs/                               # Complete documentation
│   ├── USER_GUIDE.md                   # User manual for all roles
│   ├── DEVELOPER_GUIDE.md              # Development setup and workflow
│   ├── SECURITY.md                     # Security practices and policies
│   ├── DEPLOYMENT.md                   # Production deployment guide
│   ├── MAINTENANCE.md                  # System maintenance procedures
│   └── swagger.js                      # API documentation (OpenAPI)
├── public/                             # Frontend application files

│   ├── index.html                      # Main landing page
│   ├── app.js                          # Core frontend logic
│   ├── config.js                       # Configuration settings
│   ├── styles.css                      # Global styling
│   ├── navbar.js                       # Navigation bar logic
│   ├── notifications.js                # Notification system
│   ├── storage.js                      # Local storage utilities
│   ├── favicon.ico                     # Site icon
│   ├── logo-32x32.png                  # Application logo

│   # Authentication & Security
│   ├── forgot-password.js              # Password reset logic
│   ├── reset-password.html             # Password reset page
│   ├── two-factor-auth.js              # Two-factor authentication logic
│   ├── two-factor-auth.css             # 2FA styling
│   ├── two-factor-integration.js       # 2FA integration logic
│   ├── password-security.js            # Password policy enforcement
│   ├── password-security.css           # Password security styling
│   ├── password-strength.js            # Password strength checker
│   ├── password-policy-admin.js        # Admin password policy controls
│   ├── session-manager.js              # Session management logic
│   ├── session-timeout.js              # Auto logout functionality
│   ├── session-timeout-admin.js        # Admin session controls
│   ├── session-timeout.css             # Session timeout styling
│   ├── privacy.html                    # Privacy policy page
│   ├── data-protection.html            # Data protection information

│   # Account & User Management
│   ├── account-settings.html           # User account settings page
│   ├── account-settings.js             # Account settings logic
│   ├── account-settings-styles.css     # Account settings styling
│   ├── profile.html                    # User profile page
│   ├── user-roles.html                 # Role assignment interface
│   ├── role-manager.js                 # Role management logic
│   ├── role-selection-wizard.js        # Role selection workflow
│   ├── role-wizard.js                  # Role wizard controller
│   ├── role-wizard-styles.css          # Role wizard styling
│   ├── role-change-approval.js         # Role change approval logic
│   ├── role-landing-system.js          # Role-based landing system
│   ├── comprehensive-registration.js   # Registration workflow

│   # Dashboards
│   ├── dashboard.html                  # Main dashboard entry
│   ├── dashboard-public.html           # Public dashboard
│   ├── dashboard-investigator.html     # Investigator dashboard
│   ├── dashboard-analyst.html          # Analyst dashboard
│   ├── dashboard-auditor.html          # Auditor dashboard
│   ├── dashboard-court.html            # Court dashboard
│   ├── dashboard-legal.html            # Legal dashboard
│   ├── dashboard-manager.html          # Manager dashboard
│   ├── dashboard-navigator.js          # Dashboard routing logic
│   ├── admin.html                      # Administrator dashboard

│   # Case Management
│   ├── case-management.html            # Case management interface
│   ├── cases.html                      # Case list page
│   ├── case-status-manager.js          # Case status logic
│   ├── case-status-styles.css          # Case status styling
│   ├── case-summary-exporter.js        # Case export utility
│   ├── case-timeline.html              # Case timeline view
│   ├── case-hash-manifest.js           # Case integrity tracking

│   # Evidence Management
│   ├── evidence-manager.html           # Evidence management interface
│   ├── evidence-display.js             # Evidence display logic
│   ├── evidence-display.css            # Evidence display styling
│   ├── enhanced-evidence-upload.js     # Enhanced upload system
│   ├── enhanced-upload-styles.css      # Upload styling
│   ├── evidence-preview.js             # Evidence preview logic
│   ├── evidence-preview.css            # Preview styling
│   ├── evidence-preview-styles.css     # Additional preview styles
│   ├── evidence-preview-system.js      # Preview system controller
│   ├── evidence-tagging.html           # Evidence tagging page
│   ├── evidence-tagging.js             # Tagging logic
│   ├── evidence-verification.html      # Evidence verification page
│   ├── evidence-verification.js        # Verification logic
│   ├── evidence-viewers.js             # Evidence viewers
│   ├── evidence-export.html            # Evidence export page
│   ├── evidence-exporter.js            # Export logic
│   ├── evidence-comparison.html        # Evidence comparison page
│   ├── evidence-comparison.js          # Comparison logic
│   ├── evidence-comparison.css         # Comparison styling

│   # Policy & Compliance
│   ├── retention-policy.html           # Retention policy interface
│   ├── retention-policy.js             # Retention logic
│   ├── retention-policy-manager.js     # Policy management logic
│   ├── retention-policy-styles.css     # Policy styling
│   ├── legal-hold-management.html      # Legal hold interface
│   ├── audit-trail.html                # Audit trail page
│   ├── activity-feed-widget.js         # Activity tracking widget
│   ├── blockchain-feedback.js          # Blockchain feedback system

│   # UI/UX & Accessibility
│   ├── accessibility-manager.js        # Accessibility controls
│   ├── accessibility-fixes.css         # Accessibility fixes
│   ├── responsive-improvements.css     # Responsive design updates
│   ├── empty-states-system.js          # Empty state handling
│   ├── stability-fixes.css             # UI stability fixes
│   ├── enhanced-stability.js           # Stability improvements
│   ├── fixed-navbar.js                 # Navbar fixes

│   # Help & Support
│   ├── help-center.html                # Help center page
│   ├── help-center.js                  # Help center logic
│   ├── help-center-styles.css          # Help center styling

│   # System Monitoring
│   ├── system-health.html              # System health dashboard
│   ├── timeline-visualization.html     # Timeline visualization
│   ├── timeline-visualization.js       # Timeline logic

│   # Utilities
│   ├── enhanced-error-handling.js      # Error handling utilities
│   └── tag-manager.js                  # Tag management logic

├── server.js                           # Express.js backend server
├── complete-database-setup-fixed.sql  # Complete database schema
├── package.json                        # Dependencies and scripts
├── render.yaml                         # Render.com deployment config
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore rules
├── LICENSE                             # Apache 2.0 license
├── SECURITY.md                         # Security policy
└── README.md                           # Project documentation
```

### Key File Descriptions

**Core System Files:**
- `server.js` - Express backend with Socket.IO, handles all API endpoints, authentication, file uploads
- `public/app.js` - Main frontend application logic, handles wallet connection, user registration, navigation
- `public/config.js` - Configuration settings for API URLs, file limits, blockchain network settings
- `complete-database-setup-fixed.sql` - Complete PostgreSQL schema with 17+ tables, RLS policies, functions

**Frontend Pages:**
- `public/index.html` - Landing page with login options (MetaMask/Email)
- `public/admin.html` - Administrator dashboard for user management and system oversight
- `public/dashboard-*.html` - Role-specific dashboards for all 8 user roles
- `public/case-management.html` - Case creation and management interface
- `public/evidence-*.html` - Evidence upload, viewing, comparison, and export interfaces

**Feature Modules:**
- `public/*-manager.js` - JavaScript modules for specific features (case, evidence, role management)
- `public/enhanced-*.js` - Enhanced functionality modules (upload, error handling, stability)
- `public/notifications.js` - Real-time notification system
- `public/storage.js` - Local storage management utilities

**Documentation:**
- `docs/USER_GUIDE.md` - Complete user manual with role-specific instructions
- `docs/DEVELOPER_GUIDE.md` - Development setup, API reference, architecture guide
- `docs/SECURITY.md` - Security implementation details and best practices
- `docs/DEPLOYMENT.md` - Production deployment instructions for Render.com
- `docs/MAINTENANCE.md` - System maintenance and troubleshooting procedures

**Configuration:**
- `.env.example` - Template for environment variables (Supabase credentials, etc.)
- `render.yaml` - Render.com deployment configuration
- `package.json` - Node.js dependencies and npm scripts

---

## 📚 Documentation

### Quick Links
- 🚀 [Quick Start](#-how-to-run-locally)
- 📖 [User Guide](docs/USER_GUIDE.md)
- 💻 [Developer Guide](docs/DEVELOPER_GUIDE.md)
- 📡 [API Documentation](docs/swagger.js)
- 🔒 [Security Guide](docs/SECURITY.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md)
- 🔧 [Maintenance Guide](docs/MAINTENANCE.md)

### Complete Documentation

| Topic | Description | Link |
|-------|-------------|------|
| **User Guide** | Role-specific guides and common tasks | [👤 User Guide](docs/USER_GUIDE.md) |
| **Developer Guide** | Setup, architecture, and development workflow | [💻 Developer Guide](docs/DEVELOPER_GUIDE.md) |
| **API Documentation** | Complete API reference with examples | [📡 API Docs](docs/swagger.js) |
| **Security Guide** | Security practices and vulnerability mitigations | [🔒 Security Guide](docs/SECURITY.md) |
| **Deployment Guide** | Deploy to Render, Vercel, or Netlify | [🚀 Deployment](docs/DEPLOYMENT.md) |
| **Maintenance Guide** | Regular maintenance and troubleshooting | [🔧 Maintenance](docs/MAINTENANCE.md) |

---

## 🚀 How to Run Locally

### Prerequisites
Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **MetaMask** browser extension - [Install](https://metamask.io/)
- **Supabase** account - [Sign up](https://supabase.com/)
- **Code Editor** (VS Code recommended)

### 1. Clone Repository
```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd blockchain-evidence
```

### 2. Install Dependencies & Setup
```bash
# Install all required packages and run setup
npm install

# Or run setup manually
npm run setup
```

### 3. Environment Configuration
The setup script creates a `.env` file automatically. Update it with your Supabase credentials:

```env
# Update these values in .env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select existing one
3. Navigate to SQL Editor
4. Execute the following SQL files in order:

```sql
-- Step 1: Core database structure
-- Copy and run: complete-database-setup.sql

-- Step 2: Evidence tagging system (optional)
-- Copy and run: evidence-tagging-schema.sql

-- Step 3: Evidence export system (optional)
-- Copy and run: evidence-export-schema.sql
```

### 5. Start Development Server
```bash
# Start the backend server with auto-reload
npm run dev

# Or for production mode
npm start
```

The server will start on `http://localhost:3000`

### 6. Access the Application
Open your browser and navigate to:
- **Main Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

### 7. Test the System

#### Option 1: MetaMask Wallet Login
1. Navigate to the login page
2. Click "Connect Wallet" button
3. MetaMask extension will popup automatically
4. Connect with any wallet address
5. The system will create test users automatically
6. Select a role and complete registration

#### Option 2: Email Login
Use these pre-configured test accounts:

| Email | Password | Role |
|-------|----------|------|
| `investigator@evid-dgc.com` | `hashed_password_123` | Investigator |
| `analyst@evid-dgc.com` | `hashed_password_456` | Forensic Analyst |
| `legal@evid-dgc.com` | `hashed_password_789` | Legal Professional |
| `admin@evid-dgc.com` | `admin_password` | Administrator |

**Note**: These are demo credentials for testing. In production, use secure passwords and proper authentication.

### Quick Troubleshooting

**Issue: "Config not defined" error**
- Solution: Ensure `config.js` is loaded before `app.js` in HTML

**Issue: Navigation not working**
- Solution: Check browser console for JavaScript errors
- Ensure Lucide icons are loading properly

**Issue: Wallet connection fails**
- Solution: Install MetaMask browser extension
- Check browser console for detailed error messages

**Issue: Server won't start**
- Solution: Check `.env` file exists and has correct format
- Ensure port 3000 is not in use by another application

### Development Commands
```bash
# Start development server
npm start

# Install new dependency
npm install package-name

# Check server health
curl http://localhost:3000/api/health

# View logs
# Check browser console and server terminal
```

---

## 🚀 Production Deployment

### Deployment Options
The application can be deployed on various platforms:
- **Platform**: Render.com, Vercel, or Netlify
- **Database**: Supabase (PostgreSQL)
- **File Storage**: IPFS via Pinata

### Deployment Configuration

#### Environment Variables Required
Ensure the following environment variables are set in your production environment:

```env
# Supabase Configuration
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key

# Server Configuration
PORT=3000
NODE_ENV=production

# IPFS/Pinata Configuration (if using)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Blockchain Network
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_RPC_URL=your_rpc_url

```

### Deploy to Render

#### Using Git Integration (Recommended)
1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   ```yaml
   Name: evid-dgc
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**:
   - Add all required environment variables in Render dashboard
   - Navigate to "Environment" tab
   - Add each variable from the list above

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically deploy on every push to main branch


### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

Or drag and drop the `public` folder on [Netlify Drop](https://app.netlify.com/drop).


### Continuous Deployment
The project is configured for automatic deployment:
- **Trigger**: Push to `main` branch
- **Build**: Automatic via `npm install`
- **Deploy**: Automatic via hosting provider
- **Rollback**: Available through hosting dashboard

### Monitoring & Logs
- **Application Logs**: Available in Render/Vercel/Netlify dashboard
- **Database Logs**: Available in Supabase dashboard
- **Uptime Monitoring**: Consider using services like UptimeRobot

For detailed deployment troubleshooting, see [Deployment Documentation](docs/DEPLOYMENT.md).

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (MetaMask +    │
│   Frontend)     │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│     Express.js Backend          │
│  ┌──────────────────────────┐   │
│  │  Authentication Layer    │   │
│  │  (MetaMask/Email)        │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Role-Based Access       │   │
│  │  Control (RBAC)          │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Evidence Processing     │   │
│  │  (Upload/Watermark)      │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Real-time Events        │   │
│  │  (Socket.IO)             │   │
│  └──────────────────────────┘   │
└────┬──────────┬─────────┬───────┘
     │          │         │
     │          │         │
     ▼          ▼         ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│Supabase │ │  IPFS   │ │Blockchain│
│PostgreSQL│ │(Pinata) │ │(Polygon) │
│   +RLS  │ │ Storage │ │ Network  │
└─────────┘ └─────────┘ └──────────┘
```

### Data Flow

**Evidence Upload Flow**:
1. User authenticates via MetaMask or Email
2. Role verification through RBAC system
3. Evidence file uploaded to Express backend
4. File processed (watermark, compression)
5. File stored in IPFS via Pinata
6. Metadata and IPFS hash stored in Supabase
7. Transaction recorded on Polygon blockchain
8. Audit log created in database
9. Real-time notification sent via Socket.IO

**Access Control Flow**:
1. User login → JWT token generated
2. Each request validated against user role
3. Supabase RLS policies enforce database security
4. Audit trail logged for compliance

### Key Components

| Component | Technology | Purpose |
|-----------|------------|----------|
| **Frontend** | HTML/CSS/JS | User interface and interactions |
| **API Server** | Express.js | REST API and business logic |
| **WebSocket** | Socket.IO | Real-time notifications |
| **Database** | Supabase (PostgreSQL) | Structured data storage |
| **File Storage** | IPFS/Pinata | Decentralized evidence storage |
| **Blockchain** | Polygon | Immutable audit trail |
| **Authentication** | MetaMask/Supabase Auth | User authentication |
| **Authorization** | Custom RBAC | Role-based permissions |

For detailed architecture documentation, see [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md).

---

## ⭐ Support & Star
If you find this project helpful, please consider giving it a **Star**! It helps others discover the project and keeps the maintainers motivated.

---

## 💬 Suggestions & Feedback
We value your feedback! If you have suggestions for new features or have found a bug, please open an issue or start a discussion in your repository.

---

## 🤝 Contributing

We welcome contributions from developers, security researchers, legal professionals, and anyone passionate about improving digital evidence management!

### 🚀 Quick Start for Contributors

1. **Fork the repository** and clone it locally
2. **Read our [Contributing Guide](CONTRIBUTING.md)** for detailed instructions
3. **Check out [open issues](https://github.com/Gooichand/blockchain-evidence/issues)** for ways to help
4. **Join the discussion** in GitHub Discussions

### 🎯 Ways to Contribute

- 🐛 **Bug Reports**: Found an issue? Let us know!
- 💡 **Feature Requests**: Have ideas for improvements?
- 🔧 **Code Contributions**: Fix bugs or add new features
- 📚 **Documentation**: Help improve our guides and docs
- 🎨 **Design & UX**: Enhance the user interface
- 🧪 **Testing**: Help us test new features
- 🌐 **Localization**: Translate the app to other languages

### 📋 Contribution Process

1. **Choose an issue** or propose a new feature
2. **Fork and create a branch** for your changes
3. **Make your changes** following our coding standards
4. **Test thoroughly** and add documentation
5. **Submit a pull request** with a clear description

For detailed guidelines, see our **[Contributing Guide](CONTRIBUTING.md)**.

---

## 👥 Contributors

Thanks to all the amazing people who have contributed to EVID-DGC! 🎉

### 🏆 Core Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Gooichand">
        <img src="https://github.com/Gooichand.png" width="100px;" alt="Gooichand"/><br />
        <sub><b>Gooichand</b></sub>
      </a><br />
      <sub>🚀 Project Lead & Core Developer</sub>
    </td>
  </tr>
</table>

### 🌟 All Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

**Want to see your name here?** Check out our [Contributing Guide](CONTRIBUTING.md) and start contributing today!

### 🎖️ Recognition

We recognize contributors in multiple ways:
- **README Contributors Section** (above)
- **Release Notes** for significant contributions  
- **GitHub Contributors Page** automatic recognition
- **Special Mentions** in project updates and social media

### 💝 How to Get Involved

- **Star the repository** ⭐ to show your support
- **Watch the repository** 👀 to stay updated
- **Fork and contribute** 🍴 to help improve the project
- **Share with others** 📢 who might be interested
- **Join discussions** 💬 in GitHub Issues and Discussions

---

## 📄 License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

```
Copyright 2025 EVID-DGC Blockchain Evidence Management System

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 📜 Code of Conduct
We are committed to providing a friendly, safe, and welcoming environment. Please review our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

<p align="right"><a href="#-evid-dgc---blockchain-evidence-management-system">Back to Top ↑</a></p>
