# 🤝 Contributing to EVID-DGC

**To understand how EVID-DGC works see this YouTube video**

YT English --- https://youtu.be/kN0cb3W8CuM

YT Hindi-- https://youtu.be/rMMn96qQSYI

YT Telugu -- https://youtu.be/qLFbRyZmbkw

LIVE link Project --https://blockchain-evidence.onrender.com/

Thank you for your interest in contributing to EVID-DGC! We welcome contributions from developers, security researchers, legal professionals, and anyone passionate about improving digital evidence management.

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🛠️ Development Setup](#️-development-setup)
- [📝 How to Contribute](#-how-to-contribute)
- [🎯 Types of Contributions](#-types-of-contributions)
- [📋 Coding Standards](#-coding-standards)
- [🔍 Testing Guidelines](#-testing-guidelines)
- [📖 Documentation](#-documentation)
- [🐛 Bug Reports](#-bug-reports)
- [💡 Feature Requests](#-feature-requests)
- [🔒 Security Issues](#-security-issues)
- [🆘 Common Setup Issues](#-common-setup-issues)
- [📞 Getting Help](#-getting-help)

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR-USERNAME/blockchain-evidence.git
   cd blockchain-evidence
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Set up environment**:

   ```bash
   cp .env.example .env
   # ⚠️ IMPORTANT: Edit .env with your Supabase credentials (see detailed steps below)
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Git** ([Download](https://git-scm.com/))
- **MetaMask** browser extension ([Install](https://metamask.io/))
- **Supabase** account ([Sign up](https://supabase.com/))

### Environment Configuration

#### Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**:
   - Navigate to [https://app.supabase.com/](https://app.supabase.com/)
   - Sign in or create a free account

2. **Create a New Project**:
   - Click **"New Project"** button
   - Fill in project details (name, password, region)
   - Click **"Create new project"**
   - Wait 2-3 minutes for initialization

#### Step 2: Get Your Supabase Credentials

**⚠️ CRITICAL: Use the correct API key**

1. **Navigate to Project Settings**:
   - In your Supabase project dashboard
   - Click **Settings** icon (⚙️) in the left sidebar
   - Select **API** from the settings menu

2. **Copy Your Project URL**:
   - Under "Project URL" section
   - Copy the URL (format: `https://xxxxx.supabase.co`)
   - This is your `SUPABASE_URL`

3. **Copy Your API Key** (ANON PUBLIC Key):
   - Scroll to "Project API keys" section
   - You'll see two keys:
     - **`anon` `public`** ← ✅ **USE THIS ONE**
     - **`service_role` `secret`** ← ❌ **DO NOT USE**
   - Click the copy icon next to the **anon public** key
   - This is your `SUPABASE_KEY`

   > **Why anon key?** The anon (public) key is safe for client-side use and has proper security restrictions. The service_role key has full database access and should never be used in client applications.

#### Step 3: Configure Environment File

**⚠️ FILE NAMING CRITICAL**

Your environment file **MUST** be named exactly `.env` (with a leading dot). Common mistakes:

- ❌ `env` (missing dot)
- ❌ `env.txt` (wrong extension)
- ❌ `.env.txt` (wrong extension)
- ✅ `.env` (correct)

1. **Create your environment file**:

   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file**:
   - Open `.env` in your code editor
   - Replace placeholder values with your actual credentials:

   ```bash
   # Replace with your actual Project URL from Step 2
   SUPABASE_URL=https://xxxxx.supabase.co

   # Replace with your actual anon public key from Step 2
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   > **Note**: The anon key is very long (200+ characters). Make sure you copy the entire string.

3. **Save the file** in the project root directory

#### Step 4: Set up Database

1. **Open Supabase SQL Editor**:
   - In Supabase dashboard, click **SQL Editor** in left sidebar
   - Click **"New query"** button

2. **Run the database setup script**:
   - Open `complete-database-setup.sql` from your local project
   - Copy all SQL code
   - Paste into Supabase SQL Editor
   - Click **"Run"** button or press `Ctrl+Enter`

3. **Verify tables created**:
   - Click **Table Editor** in left sidebar
   - Confirm you see tables: `users`, `evidence`, `case_files`, `audit_logs`

### Project Structure

```
blockchain-evidence/
├── public/                 # Frontend files
│   ├── index.html         # Main landing page
│   ├── app.js             # Core frontend logic
│   ├── config.js          # Configuration
│   ├── styles.css         # Global styles
│   └── dashboard-*.html   # Role-specific dashboards
├── server.js              # Express.js backend
├── complete-database-setup.sql # Database schema
├── package.json           # Dependencies
├── .env.example          # Environment template
├── .env                  # Your credentials (create this, never commit)
└── docs/                 # Documentation
```

## 📝 How to Contribute

### 1. Choose an Issue

- Browse [open issues](https://github.com/Gooichand/blockchain-evidence/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write clean, readable code
- Follow our [coding standards](#-coding-standards)
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run the application
npm start

# Test different user roles
# Test both email and wallet authentication
# Verify your changes work as expected
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add evidence comparison feature"

# Or for bug fixes
git commit -m "fix: resolve login issue with MetaMask"
```

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear title and description
- Reference any related issues
- Screenshots/videos if applicable

## 🎯 Types of Contributions

### 🔧 Code Contributions

- **New Features**: Evidence management, blockchain integration, UI improvements
- **Bug Fixes**: Login issues, database problems, frontend bugs
- **Performance**: Optimization, caching, database queries
- **Security**: Authentication, authorization, data protection

### 📚 Documentation

- **User Guides**: Role-specific instructions, tutorials
- **Developer Docs**: API documentation, architecture guides
- **README**: Improvements, clarifications, examples
- **Code Comments**: Inline documentation, function descriptions

### 🎨 Design & UX

- **UI/UX**: Interface improvements, accessibility
- **Icons & Graphics**: Visual assets, logos
- **Responsive Design**: Mobile compatibility
- **User Experience**: Workflow improvements

### 🧪 Testing

- **Unit Tests**: Function-level testing
- **Integration Tests**: API endpoint testing
- **User Testing**: Manual testing scenarios
- **Security Testing**: Vulnerability assessments

### 🌐 Localization

- **Translations**: Multi-language support
- **Regional Compliance**: Legal requirements by jurisdiction
- **Cultural Adaptation**: Region-specific features

## 📋 Coding Standards

### JavaScript Style

```javascript
// Use const/let instead of var
const userAccount = '0x123...';
let currentUser = null;

// Use descriptive function names
async function handleEmailLogin(email, password) {
  // Function implementation
}

// Use proper error handling
try {
  const response = await fetch('/api/auth/login');
  const data = await response.json();
} catch (error) {
  console.error('Login failed:', error);
  showAlert('Login failed. Please try again.', 'error');
}
```

### HTML Structure

```html
<!-- Use semantic HTML -->
<main id="main-content">
  <section class="login-section">
    <h2>Login Options</h2>
    <form id="loginForm">
      <!-- Form content -->
    </form>
  </section>
</main>

<!-- Include accessibility attributes -->
<button aria-label="Connect MetaMask wallet" onclick="connectWallet()">Connect Wallet</button>
```

### CSS Guidelines

```css
/* Use BEM methodology for class names */
.card {
  /* Block */
}

.card__header {
  /* Element */
}

.card--featured {
  /* Modifier */
}

/* Use CSS custom properties */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
}
```

### Backend Standards

```javascript
// Use proper HTTP status codes
app.post('/api/auth/login', async (req, res) => {
  try {
    // Success
    res.status(200).json({ success: true, user });
  } catch (error) {
    // Client error
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

// Validate input data
const { email, password } = req.body;
if (!email || !password) {
  return res.status(400).json({ error: 'Email and password required' });
}
```

## 🔍 Testing Guidelines

### Manual Testing Checklist

- [ ] **Email Login**: Test with valid/invalid credentials
- [ ] **Wallet Login**: Test MetaMask connection and registration
- [ ] **Role-based Access**: Verify different user roles work correctly
- [ ] **Evidence Upload**: Test file upload with various formats
- [ ] **Responsive Design**: Test on mobile and desktop
- [ ] **Error Handling**: Test error scenarios and messages

### Test Accounts

Use these pre-configured accounts for testing:

```javascript
// Email accounts (any password works)
const testAccounts = [
  { email: 'admin@evid-dgc.com', role: 'administrator' },
  { email: 'investigator@evid-dgc.com', role: 'investigator' },
  { email: 'analyst@evid-dgc.com', role: 'forensic_analyst' },
  { email: 'legal@evid-dgc.com', role: 'legal_professional' },
];
```

## 📖 Documentation

### Code Documentation

```javascript
/**
 * Handles user authentication via email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} Authentication result with user data
 * @throws {Error} When authentication fails
 */
async function handleEmailLogin(email, password) {
  // Implementation
}
```

### API Documentation

Document all API endpoints:

```javascript
/**
 * POST /api/auth/email-login
 *
 * Authenticates user with email and password
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "userpassword"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "jwt_token",
 *   "user": { ... }
 * }
 */
```

## 🐛 Bug Reports

When reporting bugs, please include:

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**

- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Node.js version: [e.g. 16.14.0]

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Any other context, mockups, or examples.
```

## 🔒 Security Issues

**⚠️ Please DO NOT report security vulnerabilities in public issues!**

Instead:

1. **Email us**: Send details to DGC2MHNE@proton.me
2. **Include**: Detailed description and steps to reproduce
3. **Wait**: We'll respond within 48 hours
4. **Coordinate**: We'll work with you on disclosure timeline

### Security Scope

We're particularly interested in:

- Authentication bypasses
- SQL injection vulnerabilities
- XSS vulnerabilities
- File upload security issues
- Access control problems
- Blockchain integration security

## 🆘 Common Setup Issues

### Issue: "Cannot connect to Supabase"

**Check these:**

- [ ] `.env` file exists in project root (not `.env.txt` or `env`)
- [ ] `SUPABASE_URL` matches your project URL exactly
- [ ] `SUPABASE_KEY` is the **anon public** key (not service_role)
- [ ] No extra spaces or quotes in `.env` file
- [ ] Server was restarted after editing `.env`

**Verify your .env:**

```bash
# Linux/Mac
cat .env

# Windows
type .env
```

### Issue: "Database tables don't exist"

**Solution:**

1. Go to Supabase → SQL Editor
2. Click "New query"
3. Copy all code from `complete-database-setup.sql`
4. Paste and click "Run"
5. Verify in Table Editor

### Issue: "npm install fails"

**Try:**

```bash
# Clear cache and retry
npm cache clean --force
npm install

# Or delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port already in use"

**Solution:**

```bash
# Find and kill process using port 3000
# Linux/Mac:
lsof -i :3000
kill -9 [PID]

# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: DGC2MHNE@proton.me for direct contact

### Before Asking for Help

1. **Search existing issues** and discussions
2. **Check the documentation** in the docs/ folder
3. **Review the README** for setup instructions
4. **Try the troubleshooting guide** above

### When Asking for Help

- **Be specific** about your problem
- **Include error messages** and logs
- **Describe your environment** (OS, Node.js version, etc.)
- **Show what you've tried** already

## 🏆 Recognition

Contributors will be recognized in:

- **README.md** Contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Special mentions** in project updates

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Focus on the project** goals
- **Report inappropriate behavior**

## 🎉 Thank You!

Every contribution, no matter how small, makes EVID-DGC better for everyone. Whether you're fixing a typo, adding a feature, or helping with documentation, your efforts are appreciated!

---

**Happy Contributing! 🚀**

For questions about contributing, feel free to reach out via GitHub issues or email us at DGC2MHNE@proton.me.
