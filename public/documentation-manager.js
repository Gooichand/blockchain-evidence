/* ===========================================
   Evidence Digital Knowledge Center
   Documentation Manager v2.0
   =========================================== */

const DOC_DATA = {
  version: 'v2.0.0',
  released: 'Mar 2026',
  guides: 27,
  apis: 12,
  workflows: 8,
  endpoints: 45,
  security: 6,
  architecture: 5,
  integrations: 4,
  folders: [
    {
      id: 'getting-started',
      icon: 'folder-plus',
      title: 'Getting Started',
      subtitle: 'Begin your journey with EVID-DGC',
      items: [
        {
          id: 'overview',
          title: 'Overview',
          icon: 'eye',
          readingTime: '4 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Getting Started', 'Overview'],
          content: `
            <div class="doc-md">
              <h1>EVID-DGC Overview</h1>
              <p class="doc-lead">EVID-DGC is a blockchain-based digital evidence management system designed for law enforcement, forensic laboratories, prosecutors, and courts. It ensures evidence integrity through SHA-256 hashing, IPFS storage, and Polygon blockchain verification.</p>
              <div class="doc-callout doc-callout-info">
                <i data-lucide="info"></i>
                <div><strong>What is EVID-DGC?</strong> Evidence Digital Guardian Controller — a complete ecosystem for managing the lifecycle of digital evidence from collection to courtroom presentation.</div>
              </div>
              <h2>Core Capabilities</h2>
              <div class="doc-grid-2">
                <div class="doc-card-mini"><i data-lucide="fingerprint"></i><h4>SHA-256 Hashing</h4><p>Every evidence file is hashed at upload to create a unique digital fingerprint.</p></div>
                <div class="doc-card-mini"><i data-lucide="database"></i><h4>IPFS Storage</h4><p>Evidence files are stored on IPFS for decentralized, tamper-proof storage.</p></div>
                <div class="doc-card-mini"><i data-lucide="link"></i><h4>Blockchain Verification</h4><p>Hashes are recorded on the Polygon blockchain for public verifiability.</p></div>
                <div class="doc-card-mini"><i data-lucide="activity"></i><h4>Chain of Custody</h4><p>Every access and transfer is logged in an immutable audit trail.</p></div>
              </div>
              <p>EVID-DGC bridges the gap between traditional evidence management and blockchain technology, providing court-ready evidence that can be independently verified by any party.</p>
            </div>
          `
        },
        {
          id: 'intro',
          title: 'Project Introduction',
          icon: 'info',
          readingTime: '6 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Getting Started', 'Introduction'],
          content: `
            <div class="doc-md">
              <h1>Project Introduction</h1>
              <p class="doc-lead">The EVID-DGC project was created to solve the critical challenges of digital evidence management in modern law enforcement and judicial systems.</p>
              <h2>The Problem</h2>
              <p>Traditional evidence management systems face several critical issues:</p>
              <ul>
                <li><strong>Tampering Risk</strong> — Digital evidence can be altered without detection</li>
                <li><strong>Chain of Custody Gaps</strong> — Paper-based custody logs are unreliable</li>
                <li><strong>Verification Difficulty</strong> — Courts struggle to verify evidence authenticity</li>
                <li><strong>Fragmented Systems</strong> — Different agencies use incompatible systems</li>
              </ul>
              <h2>The Solution</h2>
              <p>EVID-DGC leverages blockchain technology to create an immutable, verifiable trail for every piece of digital evidence from collection to courtroom presentation.</p>
              <div class="doc-callout doc-callout-success">
                <i data-lucide="check-circle"></i>
                <div><strong>Key Innovation:</strong> First evidence management system to integrate SHA-256 hashing with IPFS decentralized storage and Polygon blockchain verification in a single unified platform.</div>
              </div>
            </div>
          `
        },
        {
          id: 'setup',
          title: 'Quick Setup',
          icon: 'zap',
          readingTime: '8 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Getting Started', 'Quick Setup'],
          content: `
            <div class="doc-md">
              <h1>Quick Setup Guide</h1>
              <p class="doc-lead">Get EVID-DGC up and running in minutes. This guide covers both the web application access and wallet setup.</p>
              <h2>1. Access the Platform</h2>
              <p>Navigate to the EVID-DGC web application. No installation required for basic access.</p>
              <h2>2. Connect Your Wallet</h2>
              <p>Click the "Connect Wallet" button and approve the connection in MetaMask. Ensure you are on the Polygon Amoy testnet.</p>
              <div class="doc-callout doc-callout-warning">
                <i data-lucide="alert-triangle"></i>
                <div><strong>Network Required:</strong> EVID-DGC runs on Polygon Amoy (chain ID: 0x13882). Switch your wallet to this network before connecting.</div>
              </div>
              <h2>3. Select Your Role</h2>
              <p>Choose your role from the available options: Public, Investigator, Analyst, Legal, Court, Manager, Auditor, or Admin.</p>
              <h2>4. Start Using the Dashboard</h2>
              <p>Once registered, you will be redirected to your role-specific dashboard where you can manage evidence, create cases, and generate reports.</p>
            </div>
          `
        },
        {
          id: 'installation',
          title: 'Installation',
          icon: 'download',
          readingTime: '10 min',
          lastUpdated: 'Jan 2026',
          breadcrumb: ['Documentation', 'Getting Started', 'Installation'],
          content: `
            <div class="doc-md">
              <h1>Installation Guide</h1>
              <p class="doc-lead">For self-hosted deployments, follow these instructions to set up the complete EVID-DGC infrastructure.</p>
              <h2>Prerequisites</h2>
              <ul>
                <li>Node.js v18+</li>
                <li>PostgreSQL (via Supabase)</li>
                <li>Redis (for job queues)</li>
                <li>MetaMask browser extension</li>
              </ul>
              <h2>Quick Install</h2>
              <div class="doc-code-block"><pre><code>git clone https://github.com/Gooichand/blockchain-evidence.git
cd blockchain-evidence
npm install
cp .env.example .env
npm run migrate
npm start</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
              <p>The server will start on port 10000. Access the application at <code>http://localhost:10000</code>.</p>
              <div class="doc-callout doc-callout-tip">
                <i data-lucide="lightbulb"></i>
                <div><strong>Tip:</strong> Use the provided Hardhat configuration for local blockchain development. Run <code>npx hardhat node</code> for a local test network.</div>
              </div>
            </div>
          `
        }
      ]
    },
    {
      id: 'investigation-workflow',
      icon: 'activity',
      title: 'Investigation Workflow',
      subtitle: 'End-to-end evidence handling procedures',
      items: [
        {
          id: 'evidence-collection',
          title: 'Evidence Collection',
          icon: 'camera',
          readingTime: '7 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Investigation Workflow', 'Evidence Collection'],
          content: `
            <div class="doc-md">
              <h1>Evidence Collection</h1>
              <p class="doc-lead">Standard operating procedures for collecting digital evidence using EVID-DGC.</p>
              <h2>Collection Process</h2>
              <div class="doc-timeline">
                <div class="doc-tl-item"><div class="doc-tl-num">1</div><div><strong>Identify</strong> — Locate and identify relevant digital evidence sources</div></div>
                <div class="doc-tl-item"><div class="doc-tl-num">2</div><div><strong>Capture</strong> — Use approved forensic tools to capture evidence</div></div>
                <div class="doc-tl-item"><div class="doc-tl-num">3</div><div><strong>Hash</strong> — Generate SHA-256 hash at the point of collection</div></div>
                <div class="doc-tl-item"><div class="doc-tl-num">4</div><div><strong>Upload</strong> — Upload to EVID-DGC with metadata and chain of custody</div></div>
              </div>
              <h2>Best Practices</h2>
              <ul>
                <li>Always generate the hash before any analysis</li>
                <li>Document every handling step in the custody log</li>
                <li>Use write-blockers when collecting from storage devices</li>
              </ul>
            </div>
          `
        },
        {
          id: 'chain-of-custody',
          title: 'Chain of Custody',
          icon: 'git-branch',
          readingTime: '5 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Investigation Workflow', 'Chain of Custody'],
          content: `
            <div class="doc-md">
              <h1>Chain of Custody</h1>
              <p class="doc-lead">Every transfer of evidence is recorded immutably on the blockchain, creating a verifiable chain of custody.</p>
              <h2>How It Works</h2>
              <p>Each time evidence is accessed, transferred, or modified, a blockchain transaction records:</p>
              <ul>
                <li>Timestamp of the action</li>
                <li>Wallet address of the person performing the action</li>
                <li>Nature of the action (view, transfer, analyze, etc.)</li>
                <li>Previous hash reference for continuity</li>
              </ul>
              <div class="doc-callout doc-callout-info">
                <i data-lucide="info"></i>
                <div>The chain of custody is cryptographically linked, meaning any break in the chain is immediately detectable.</div>
              </div>
            </div>
          `
        },
        {
          id: 'case-creation',
          title: 'Case Creation',
          icon: 'folder-plus',
          readingTime: '4 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Investigation Workflow', 'Case Creation'],
          content: `
            <div class="doc-md">
              <h1>Case Creation</h1>
              <p class="doc-lead">Create and manage investigation cases within EVID-DGC.</p>
              <h2>Creating a New Case</h2>
              <ol>
                <li>Navigate to your dashboard and click "New Case"</li>
                <li>Enter case details: case number, title, description, jurisdiction</li>
                <li>Assign investigators and other relevant personnel</li>
                <li>Set case status and priority level</li>
                <li>Submit — the case is recorded on the blockchain</li>
              </ol>
              <h2>Case Metadata</h2>
              <p>Each case stores metadata including creation date, assigned personnel, status updates, and a complete activity log.</p>
            </div>
          `
        },
        {
          id: 'evidence-upload',
          title: 'Evidence Upload',
          icon: 'upload',
          readingTime: '6 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Investigation Workflow', 'Evidence Upload'],
          content: `
            <div class="doc-md">
              <h1>Evidence Upload</h1>
              <p class="doc-lead">Upload digital evidence with automatic hashing and blockchain verification.</p>
              <h2>Upload Process</h2>
              <ol>
                <li>Select the case you want to add evidence to</li>
                <li>Click "Upload Evidence" and select your file(s)</li>
                <li>Add metadata: description, file type, source, collector name</li>
                <li>The system automatically generates a SHA-256 hash</li>
                <li>File is uploaded to IPFS and the hash is recorded on Polygon</li>
              </ol>
              <div class="doc-callout doc-callout-success">
                <i data-lucide="check-circle"></i>
                <div><strong>Automatic:</strong> The entire hashing and blockchain recording process happens automatically — no manual steps required.</div>
              </div>
              <h2>Supported File Types</h2>
              <p>Images, videos, audio files, documents (PDF, DOCX), archives (ZIP, RAR), and forensic file formats.</p>
            </div>
          `
        }
      ]
    },
    {
      id: 'user-roles',
      icon: 'users',
      title: 'User Roles',
      subtitle: 'Role-based access and permissions',
      items: [
        {
          id: 'all-roles',
          title: 'All Roles Overview',
          icon: 'user-check',
          readingTime: '5 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'User Roles', 'All Roles'],
          content: `
            <div class="doc-md">
              <h1>User Roles Overview</h1>
              <p class="doc-lead">EVID-DGC supports eight distinct roles, each with specific permissions and responsibilities.</p>
              <div class="doc-table-wrap">
                <table class="doc-table">
                  <thead><tr><th>Role</th><th>Access Level</th><th>Primary Function</th></tr></thead>
                  <tbody>
                    <tr><td>Public</td><td>View Only</td><td>Verify evidence authenticity</td></tr>
                    <tr><td>Investigator</td><td>Create, Upload, View</td><td>Collect and submit evidence</td></tr>
                    <tr><td>Analyst</td><td>Analyze, View</td><td>Forensic analysis and reporting</td></tr>
                    <tr><td>Legal</td><td>Review, View</td><td>Legal review and case preparation</td></tr>
                    <tr><td>Court</td><td>Verify, View</td><td>Evidence verification for proceedings</td></tr>
                    <tr><td>Manager</td><td>Manage, Assign</td><td>Case management and oversight</td></tr>
                    <tr><td>Auditor</td><td>Audit, View</td><td>Compliance and audit review</td></tr>
                    <tr><td>Admin</td><td>Full Access</td><td>System administration</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          `
        },
        {
          id: 'permissions',
          title: 'Permissions Matrix',
          icon: 'shield',
          readingTime: '8 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'User Roles', 'Permissions'],
          content: `
            <div class="doc-md">
              <h1>Permissions Matrix</h1>
              <p class="doc-lead">Detailed breakdown of permissions for each role in the system.</p>
              <div class="doc-table-wrap">
                <table class="doc-table">
                  <thead><tr><th>Permission</th><th>Public</th><th>Investigator</th><th>Analyst</th><th>Legal</th><th>Court</th><th>Manager</th><th>Auditor</th><th>Admin</th></tr></thead>
                  <tbody>
                    <tr><td>View Evidence</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                    <tr><td>Upload Evidence</td><td>—</td><td>✓</td><td>—</td><td>—</td><td>—</td><td>✓</td><td>—</td><td>✓</td></tr>
                    <tr><td>Create Cases</td><td>—</td><td>✓</td><td>—</td><td>—</td><td>—</td><td>✓</td><td>—</td><td>✓</td></tr>
                    <tr><td>Verify Evidence</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                    <tr><td>Delete Evidence</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>✓</td></tr>
                    <tr><td>Manage Users</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>✓</td><td>—</td><td>✓</td></tr>
                    <tr><td>Audit Logs</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>✓</td><td>✓</td></tr>
                    <tr><td>System Config</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>✓</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          `
        },
        {
          id: 'responsibilities',
          title: 'Responsibilities',
          icon: 'clipboard-list',
          readingTime: '6 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'User Roles', 'Responsibilities'],
          content: `
            <div class="doc-md">
              <h1>Role Responsibilities</h1>
              <p class="doc-lead">Each role in EVID-DGC has specific responsibilities that contribute to the integrity of the evidence management process.</p>
              <h2>Investigator</h2>
              <p>Primary evidence collectors. Responsible for ensuring proper collection procedures, accurate metadata, and initial chain of custody documentation.</p>
              <h2>Analyst</h2>
              <p>Perform forensic analysis on evidence. Must document all analysis steps and maintain the integrity of original evidence files.</p>
              <h2>Legal & Court</h2>
              <p>Review evidence for legal proceedings. Court personnel verify blockchain records during trials.</p>
              <h2>Manager</h2>
              <p>Oversee cases and assign tasks. Ensure compliance with evidence handling standards.</p>
              <h2>Auditor</h2>
              <p>Review system logs and audit trails for compliance and integrity verification.</p>
            </div>
          `
        },
        {
          id: 'workflow',
          title: 'Evidence Workflow by Role',
          icon: 'git-commit',
          readingTime: '7 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'User Roles', 'Evidence Workflow'],
          content: `
            <div class="doc-md">
              <h1>Evidence Workflow by Role</h1>
              <p class="doc-lead">How each role interacts with evidence throughout its lifecycle.</p>
              <div class="doc-flow-horizontal">
                <div class="doc-fh-step"><i data-lucide="camera"></i><span>Collect</span><small>Investigator</small></div>
                <div class="doc-fh-arrow"><i data-lucide="arrow-right"></i></div>
                <div class="doc-fh-step"><i data-lucide="upload"></i><span>Upload</span><small>Investigator</small></div>
                <div class="doc-fh-arrow"><i data-lucide="arrow-right"></i></div>
                <div class="doc-fh-step"><i data-lucide="search"></i><span>Analyze</span><small>Analyst</small></div>
                <div class="doc-fh-arrow"><i data-lucide="arrow-right"></i></div>
                <div class="doc-fh-step"><i data-lucide="scale"></i><span>Review</span><small>Legal</small></div>
                <div class="doc-fh-arrow"><i data-lucide="arrow-right"></i></div>
                <div class="doc-fh-step"><i data-lucide="gavel"></i><span>Verify</span><small>Court</small></div>
              </div>
            </div>
          `
        }
      ]
    },
    {
      id: 'system-architecture',
      icon: 'server',
      title: 'System Architecture',
      subtitle: 'Technical architecture and components',
      items: [
        {
          id: 'frontend',
          title: 'Frontend Architecture',
          icon: 'monitor',
          readingTime: '6 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'System Architecture', 'Frontend'],
          content: `
            <div class="doc-md">
              <h1>Frontend Architecture</h1>
              <p class="doc-lead">The EVID-DGC frontend is built with vanilla HTML, CSS, and JavaScript, providing a lightweight yet powerful user interface.</p>
              <h2>Key Technologies</h2>
              <ul>
                <li><strong>Vanilla JS (ES6+)</strong> — Class-based architecture with modular design</li>
                <li><strong>Lucide Icons</strong> — SVG icon library for consistent visual language</li>
                <li><strong>Lenis</strong> — Smooth scroll library for premium scrolling experience</li>
                <li><strong>Ethers.js</strong> — Blockchain interaction library for wallet and contract operations</li>
              </ul>
              <h2>Component Structure</h2>
              <p>The frontend is organized into manager classes: HeaderManager, FooterManager, NavbarManager, WalletManager, and feature-specific modules.</p>
            </div>
          `
        },
        {
          id: 'backend',
          title: 'Backend Architecture',
          icon: 'terminal',
          readingTime: '8 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'System Architecture', 'Backend'],
          content: `
            <div class="doc-md">
              <h1>Backend Architecture</h1>
              <p class="doc-lead">Node.js Express server with Socket.IO for real-time communication.</p>
              <h2>Core Stack</h2>
              <ul>
                <li><strong>Express.js</strong> — HTTP server framework</li>
                <li><strong>Socket.IO</strong> — Real-time bidirectional communication</li>
                <li><strong>Supabase</strong> — PostgreSQL database for persistent storage</li>
                <li><strong>Redis + Bull</strong> — Job queues for async processing</li>
                <li><strong>JWT</strong> — JSON Web Token authentication</li>
              </ul>
              <h2>API Structure</h2>
              <p>RESTful API with rate limiting, file upload handling via Multer, and comprehensive error handling middleware.</p>
            </div>
          `
        },
        {
          id: 'blockchain',
          title: 'Blockchain Layer',
          icon: 'link',
          readingTime: '7 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'System Architecture', 'Blockchain'],
          content: `
            <div class="doc-md">
              <h1>Blockchain Layer</h1>
              <p class="doc-lead">EVID-DGC uses the Polygon network for immutable evidence verification.</p>
              <h2>Smart Contract</h2>
              <p>The EvidenceStorage.sol contract records evidence hashes on-chain, providing permanent, tamper-proof verification.</p>
              <div class="doc-code-block"><pre><code>contract EvidenceStorage {
    mapping(bytes32 => Evidence) public evidence;
    event EvidenceStored(bytes32 indexed hash, string ipfsCID, uint256 timestamp);
    function storeEvidence(bytes32 _hash, string memory _ipfsCID) public { ... }
    function verifyEvidence(bytes32 _hash) public view returns (bool) { ... }
}</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
              <h2>Network Details</h2>
              <p>Deployed on Polygon Amoy testnet (chain ID: 0x13882). Contract address: <code>0x39453ED8CF79Fe56150fe1E8348e75894e3dD9e3</code>.</p>
            </div>
          `
        },
        {
          id: 'database',
          title: 'Database Schema',
          icon: 'database',
          readingTime: '5 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'System Architecture', 'Database'],
          content: `
            <div class="doc-md">
              <h1>Database Schema</h1>
              <p class="doc-lead">EVID-DGC uses Supabase PostgreSQL for relational data storage.</p>
              <h2>Core Tables</h2>
              <ul>
                <li><strong>users</strong> — User accounts, roles, and profile information</li>
                <li><strong>cases</strong> — Investigation case metadata</li>
                <li><strong>evidence</strong> — Evidence records with hashes and IPFS CIDs</li>
                <li><strong>audit_logs</strong> — Immutable audit trail of all actions</li>
                <li><strong>chain_of_custody</strong> — Custody transfer records</li>
              </ul>
            </div>
          `
        },
        {
          id: 'ipfs',
          title: 'IPFS Storage',
          icon: 'hard-drive',
          readingTime: '4 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'System Architecture', 'IPFS'],
          content: `
            <div class="doc-md">
              <h1>IPFS Storage</h1>
              <p class="doc-lead">Decentralized file storage using the InterPlanetary File System.</p>
              <h2>How IPFS Works in EVID-DGC</h2>
              <p>When evidence is uploaded, the file is:</p>
              <ol>
                <li>Split into chunks and content-addressed</li>
                <li>Stored across the IPFS network</li>
                <li>Assigned a unique Content Identifier (CID)</li>
                <li>The CID is linked to the blockchain record</li>
              </ol>
              <p>This ensures that evidence cannot be altered without detection, as any change would result in a different CID.</p>
            </div>
          `
        }
      ]
    },
    {
      id: 'evidence-security',
      icon: 'shield',
      title: 'Evidence Security',
      subtitle: 'Security measures and integrity controls',
      items: [
        {
          id: 'sha256',
          title: 'SHA-256 Hashing',
          icon: 'fingerprint',
          readingTime: '5 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Evidence Security', 'SHA-256'],
          content: `
            <div class="doc-md">
              <h1>SHA-256 Hashing</h1>
              <p class="doc-lead">Every piece of evidence is hashed using SHA-256 to create a unique digital fingerprint.</p>
              <h2>Why SHA-256?</h2>
              <p>SHA-256 is a cryptographic hash function that produces a 256-bit (32-byte) hash value. It is:</p>
              <ul>
                <li><strong>Collision-resistant</strong> — No two different inputs produce the same hash</li>
                <li><strong>One-way</strong> — The original data cannot be derived from the hash</li>
                <li><strong>Deterministic</strong> — Same input always produces the same hash</li>
                <li><strong>Fast</strong> — Efficient computation even for large files</li>
              </ul>
              <div class="doc-callout doc-callout-info">
                <i data-lucide="info"></i>
                <div>SHA-256 is the standard hash algorithm used by courts and forensic laboratories worldwide.</div>
              </div>
            </div>
          `
        },
        {
          id: 'tamper-proof',
          title: 'Tamper Proof System',
          icon: 'lock',
          readingTime: '6 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Evidence Security', 'Tamper Proof'],
          content: `
            <div class="doc-md">
              <h1>Tamper Proof System</h1>
              <p class="doc-lead">Multi-layered security ensures that evidence cannot be tampered with undetected.</p>
              <h2>Layers of Protection</h2>
              <ol>
                <li><strong>SHA-256 Hashing</strong> — Initial digital fingerprint at upload</li>
                <li><strong>IPFS Storage</strong> — Decentralized content-addressed storage</li>
                <li><strong>Blockchain Recording</strong> — Immutable on-chain verification</li>
                <li><strong>Audit Trail</strong> — Every access is logged and verified</li>
                <li><strong>Chain of Custody</strong> — Complete transfer history</li>
              </ol>
              <div class="doc-callout doc-callout-success">
                <i data-lucide="check-circle"></i>
                <div><strong>Result:</strong> Any tampering attempt is immediately detectable through hash mismatch or blockchain verification failure.</div>
              </div>
            </div>
          `
        },
        {
          id: 'access-control',
          title: 'Access Control',
          icon: 'key',
          readingTime: '5 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Evidence Security', 'Access Control'],
          content: `
            <div class="doc-md">
              <h1>Access Control</h1>
              <p class="doc-lead">Role-based access control ensures that only authorized personnel can access sensitive evidence.</p>
              <h2>Authentication Methods</h2>
              <ul>
                <li><strong>MetaMask Wallet</strong> — Blockchain-based authentication using digital signatures</li>
                <li><strong>Email & Password</strong> — Traditional authentication with JWT sessions</li>
              </ul>
              <h2>Authorization</h2>
              <p>Each role has granular permissions that determine what actions can be performed on evidence. All access attempts are logged in the audit trail.</p>
            </div>
          `
        },
        {
          id: 'encryption',
          title: 'Encryption Standards',
          icon: 'shield-alert',
          readingTime: '4 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Evidence Security', 'Encryption'],
          content: `
            <div class="doc-md">
              <h1>Encryption Standards</h1>
              <p class="doc-lead">Data is encrypted both in transit and at rest.</p>
              <h2>In Transit</h2>
              <p>All communications are secured via HTTPS/TLS. API endpoints use JWT tokens for authentication.</p>
              <h2>At Rest</h2>
              <p>Evidence files stored on IPFS are encrypted using AES-256. Database records are encrypted at the application level.</p>
              <h2>Wallet Security</h2>
              <p>Blockchain transactions require MetaMask signature confirmation, ensuring that only the authorized wallet owner can perform actions.</p>
            </div>
          `
        }
      ]
    },
    {
      id: 'blockchain-ipfs',
      icon: 'link-2',
      title: 'Blockchain & IPFS',
      subtitle: 'Decentralized infrastructure details',
      items: [
        {
          id: 'polygon',
          title: 'Polygon Network',
          icon: 'hexagon',
          readingTime: '5 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Blockchain & IPFS', 'Polygon Network'],
          content: `
            <div class="doc-md">
              <h1>Polygon Network</h1>
              <p class="doc-lead">EVID-DGC is deployed on the Polygon blockchain for scalable, low-cost evidence verification.</p>
              <h2>Why Polygon?</h2>
              <ul>
                <li><strong>Low Transaction Fees</strong> — Cost-effective for recording evidence hashes</li>
                <li><strong>Fast Finality</strong> — Transactions confirm in seconds</li>
                <li><strong>Ethereum Compatible</strong> — Full EVM compatibility for tooling</li>
                <li><strong>Scalable</strong> — Handles high throughput for enterprise use</li>
              </ul>
              <h2>Network Details</h2>
              <p><strong>Testnet:</strong> Polygon Amoy (chain ID: 0x13882)</p>
              <p><strong>Mainnet:</strong> Polygon PoS (chain ID: 0x89)</p>
            </div>
          `
        },
        {
          id: 'smart-contracts',
          title: 'Smart Contracts',
          icon: 'file-code',
          readingTime: '7 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Blockchain & IPFS', 'Smart Contracts'],
          content: `
            <div class="doc-md">
              <h1>Smart Contracts</h1>
              <p class="doc-lead">The EvidenceStorage smart contract is the backbone of blockchain-based evidence verification.</p>
              <h2>Contract Functions</h2>
              <ul>
                <li><strong>storeEvidence</strong> — Records evidence hash and IPFS CID on-chain</li>
                <li><strong>verifyEvidence</strong> — Verifies if a hash exists on-chain</li>
                <li><strong>transferCustody</strong> — Records custody transfers</li>
                <li><strong>getEvidenceHistory</strong> — Retrieves complete evidence history</li>
              </ul>
              <p>The contract is verified on Polygonscan and audited for security.</p>
            </div>
          `
        },
        {
          id: 'ipfs-deep',
          title: 'IPFS Deep Dive',
          icon: 'database',
          readingTime: '6 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Blockchain & IPFS', 'IPFS Deep Dive'],
          content: `
            <div class="doc-md">
              <h1>IPFS Deep Dive</h1>
              <p class="doc-lead">Understanding how IPFS provides decentralized, tamper-proof evidence storage.</p>
              <h2>Content Addressing</h2>
              <p>Unlike traditional HTTP storage (location-based), IPFS uses content addressing. Files are identified by their cryptographic hash, not their location.</p>
              <h2>Benefits for Evidence</h2>
              <ul>
                <li><strong>Immutability</strong> — Any change to the file changes its CID</li>
                <li><strong>Deduplication</strong> — Identical files are stored only once</li>
                <li><strong>Resilience</strong> — No single point of failure</li>
                <li><strong>Verifiability</strong> — Anyone can verify file integrity</li>
              </ul>
            </div>
          `
        },
        {
          id: 'verification',
          title: 'Verification Process',
          icon: 'search-check',
          readingTime: '4 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Blockchain & IPFS', 'Verification'],
          content: `
            <div class="doc-md">
              <h1>Verification Process</h1>
              <p class="doc-lead">How anyone can verify evidence authenticity using the public blockchain.</p>
              <h2>Public Verification</h2>
              <ol>
                <li>Navigate to the public verification page</li>
                <li>Enter the evidence ID or upload the evidence file</li>
                <li>The system computes the SHA-256 hash</li>
                <li>Queries the Polygon blockchain for a matching record</li>
                <li>Returns a verified / not verified result with timestamp</li>
              </ol>
              <p>No wallet or login required for verification — the blockchain is public by design.</p>
            </div>
          `
        }
      ]
    },
    {
      id: 'api-reference',
      icon: 'code',
      title: 'API Reference',
      subtitle: 'REST API documentation and examples',
      items: [
        {
          id: 'auth',
          title: 'Authentication',
          icon: 'key',
          readingTime: '5 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'API Reference', 'Authentication'],
          content: `
            <div class="doc-md">
              <h1>Authentication</h1>
              <p class="doc-lead">API authentication using JWT tokens and MetaMask wallet signatures.</p>
              <h2>JWT Authentication</h2>
              <div class="doc-code-block"><pre><code>POST /api/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "your-password" }</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
              <h2>Wallet Authentication</h2>
              <p>Connect your MetaMask wallet and sign a message to authenticate. The signature is verified against the blockchain.</p>
            </div>
          `
        },
        {
          id: 'endpoints',
          title: 'Endpoints',
          icon: 'list-end',
          readingTime: '8 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'API Reference', 'Endpoints'],
          content: `
            <div class="doc-md">
              <h1>REST API Endpoints</h1>
              <p class="doc-lead">Complete list of available API endpoints.</p>
              <div class="doc-table-wrap">
                <table class="doc-table">
                  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><span class="doc-method get">GET</span></td><td>/api/evidence/:id</td><td>Retrieve evidence details</td></tr>
                    <tr><td><span class="doc-method post">POST</span></td><td>/api/evidence</td><td>Upload new evidence</td></tr>
                    <tr><td><span class="doc-method get">GET</span></td><td>/api/cases</td><td>List all cases</td></tr>
                    <tr><td><span class="doc-method post">POST</span></td><td>/api/cases</td><td>Create new case</td></tr>
                    <tr><td><span class="doc-method get">GET</span></td><td>/api/verify/:hash</td><td>Verify evidence on blockchain</td></tr>
                    <tr><td><span class="doc-method get">GET</span></td><td>/api/audit/:evidenceId</td><td>Get audit trail</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          `
        },
        {
          id: 'responses',
          title: 'Response Formats',
          icon: 'file-json',
          readingTime: '4 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'API Reference', 'Responses'],
          content: `
            <div class="doc-md">
              <h1>Response Formats</h1>
              <p class="doc-lead">Standard API response structure.</p>
              <h2>Success Response</h2>
              <div class="doc-code-block"><pre><code>{
  "success": true,
  "data": { /* response payload */ },
  "timestamp": "2026-03-15T10:30:00Z"
}</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
              <h2>Error Response</h2>
              <div class="doc-code-block"><pre><code>{
  "success": false,
  "error": { "code": "EVID_NOT_FOUND", "message": "Evidence not found" },
  "timestamp": "2026-03-15T10:30:00Z"
}</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
            </div>
          `
        },
        {
          id: 'examples',
          title: 'Code Examples',
          icon: 'braces',
          readingTime: '6 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'API Reference', 'Examples'],
          content: `
            <div class="doc-md">
              <h1>Code Examples</h1>
              <p class="doc-lead">Practical examples of API usage in different languages.</p>
              <h2>JavaScript</h2>
              <div class="doc-code-block"><pre><code>const response = await fetch('/api/evidence', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ caseId: 'CASE-001', description: 'Evidence file', fileHash: sha256Hash })
});
const result = await response.json();</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
              <h2>Python</h2>
              <div class="doc-code-block"><pre><code>import requests
headers = {'Authorization': f'Bearer {token}'}
response = requests.post('/api/evidence', json={'caseId': 'CASE-001', 'description': 'Evidence file'}, headers=headers)</code></pre><button class="doc-copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)"><i data-lucide="copy"></i></button></div>
            </div>
          `
        }
      ]
    },
    {
      id: 'legal-court',
      icon: 'scale',
      title: 'Legal & Court',
      subtitle: 'Court-ready evidence and legal documentation',
      items: [
        {
          id: 'court-reports',
          title: 'Court Reports',
          icon: 'file-text',
          readingTime: '6 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Legal & Court', 'Court Reports'],
          content: `
            <div class="doc-md">
              <h1>Court Reports</h1>
              <p class="doc-lead">Generate court-ready evidence reports with complete blockchain verification records.</p>
              <h2>Report Contents</h2>
              <ul>
                <li>Evidence summary with metadata</li>
                <li>SHA-256 hash values</li>
                <li>IPFS content identifiers (CIDs)</li>
                <li>Blockchain transaction records</li>
                <li>Complete chain of custody timeline</li>
                <li>Verification certificates</li>
              </ul>
              <p>Reports can be exported as PDF with a built-in QR code for immediate blockchain verification.</p>
            </div>
          `
        },
        {
          id: 'evidence-standards',
          title: 'Evidence Standards',
          icon: 'clipboard-check',
          readingTime: '5 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Legal & Court', 'Evidence Standards'],
          content: `
            <div class="doc-md">
              <h1>Evidence Standards</h1>
              <p class="doc-lead">EVID-DGC complies with international digital evidence standards.</p>
              <h2>Compliance Frameworks</h2>
              <ul>
                <li><strong>ISO 27037</strong> — Guidelines for identification, collection, and preservation of digital evidence</li>
                <li><strong>NIST SP 800-86</strong> — Guide to integrating forensic techniques into incident response</li>
                <li><strong>SWGDE</strong> — Scientific Working Group on Digital Evidence best practices</li>
                <li><strong>GDPR</strong> — Data protection compliance for European jurisdictions</li>
              </ul>
            </div>
          `
        },
        {
          id: 'compliance',
          title: 'Compliance',
          icon: 'check-square',
          readingTime: '4 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Legal & Court', 'Compliance'],
          content: `
            <div class="doc-md">
              <h1>Compliance</h1>
              <p class="doc-lead">Regulatory compliance and data protection measures.</p>
              <h2>Data Protection</h2>
              <p>EVID-DGC implements encryption, access controls, and audit logging to comply with data protection regulations.</p>
              <h2>Chain of Custody Compliance</h2>
              <p>All custody transfers are recorded with timestamps, user identities, and cryptographic signatures, meeting the highest standards for evidence admissibility.</p>
            </div>
          `
        },
        {
          id: 'legal-hold',
          title: 'Legal Hold',
          icon: 'clock',
          readingTime: '4 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Legal & Court', 'Legal Hold'],
          content: `
            <div class="doc-md">
              <h1>Legal Hold Management</h1>
              <p class="doc-lead">Manage legal holds on evidence to prevent premature deletion or alteration.</p>
              <h2>Hold Process</h2>
              <p>When a legal hold is placed on evidence:</p>
              <ol>
                <li>The evidence is flagged as "on hold" in the system</li>
                <li>No deletion or modification is permitted</li>
                <li>All access attempts are logged with heightened scrutiny</li>
                <li>The hold is recorded on the blockchain for transparency</li>
              </ol>
              <p>Only authorized legal or court personnel can place or remove holds.</p>
            </div>
          `
        }
      ]
    },
    {
      id: 'troubleshooting',
      icon: 'wrench',
      title: 'Troubleshooting',
      subtitle: 'Common issues and solutions',
      items: [
        {
          id: 'common-issues',
          title: 'Common Issues',
          icon: 'alert-triangle',
          readingTime: '5 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Troubleshooting', 'Common Issues'],
          content: `
            <div class="doc-md">
              <h1>Common Issues</h1>
              <p class="doc-lead">Frequently encountered issues and their solutions.</p>
              <div class="doc-issue">
                <h3>MetaMask not connecting</h3>
                <p>Ensure MetaMask is installed and unlocked. Try refreshing the page or restarting your browser.</p>
              </div>
              <div class="doc-issue">
                <h3>Wrong network detected</h3>
                <p>Switch your MetaMask to Polygon Amoy testnet (chain ID: 0x13882). Use the network switcher in MetaMask.</p>
              </div>
              <div class="doc-issue">
                <h3>Evidence upload failing</h3>
                <p>Check file size (max 50MB) and file type. Ensure you have a stable internet connection for IPFS upload.</p>
              </div>
            </div>
          `
        },
        {
          id: 'support',
          title: 'Support',
          icon: 'headphones',
          readingTime: '3 min',
          lastUpdated: 'Feb 2026',
          breadcrumb: ['Documentation', 'Troubleshooting', 'Support'],
          content: `
            <div class="doc-md">
              <h1>Support</h1>
              <p class="doc-lead">How to get help with EVID-DGC.</p>
              <h2>Contact Methods</h2>
              <ul>
                <li><strong>GitHub Issues</strong> — Report bugs and request features</li>
                <li><strong>Documentation</strong> — Browse this knowledge center</li>
                <li><strong>Email</strong> — Contact the development team</li>
              </ul>
              <div class="doc-callout doc-callout-info">
                <i data-lucide="info"></i>
                <div>Before contacting support, check the common issues section and search this documentation.</div>
              </div>
            </div>
          `
        },
        {
          id: 'known-problems',
          title: 'Known Problems',
          icon: 'bug',
          readingTime: '4 min',
          lastUpdated: 'Mar 2026',
          breadcrumb: ['Documentation', 'Troubleshooting', 'Known Problems'],
          content: `
            <div class="doc-md">
              <h1>Known Problems</h1>
              <p class="doc-lead">Current known issues being worked on.</p>
              <div class="doc-issue doc-issue-warning">
                <h3>IPFS Gateway Latency</h3>
                <p>Occasional latency when accessing files from IPFS gateways. Being mitigated with additional gateway redundancy.</p>
              </div>
              <div class="doc-issue doc-issue-warning">
                <h3>MetaMask Popup Blocked</h3>
                <p>Some browsers block MetaMask popups. Allow popups for the site or manually open MetaMask.</p>
              </div>
            </div>
          `
        }
      ]
    }
  ]
};

class DocumentationManager {
  constructor() {
    this.state = {
      activeFolder: null,
      activeItem: null,
      searchQuery: '',
      searchVisible: false,
      recentSearches: [],
      bookmarks: JSON.parse(localStorage.getItem('evid-doc-bookmarks') || '[]'),
      readingProgress: JSON.parse(localStorage.getItem('evid-doc-progress') || '{}'),
      recentlyViewed: JSON.parse(localStorage.getItem('evid-doc-recent') || '[]')
    };
    this.container = null;
    this.viewerEl = null;
    this.sidebarEl = null;
    this.searchInput = null;
    this.stylesInjected = false;
  }

  init() {
    if (this.container) return;
    const section = document.getElementById('documentation');
    if (!section) { console.warn('Documentation section not found'); return; }
    this.container = section;
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="doc-workspace">
        <!-- Top Header -->
        <div class="doc-header">
          <div class="doc-header-left">
            <div class="doc-badge">Evidence Knowledge Center</div>
            <h2>Documentation <span>Center</span></h2>
            <p>Everything you need to understand, deploy, investigate, secure, and verify digital evidence using EVID-DGC.</p>
          </div>
          <div class="doc-header-right">
            <div class="doc-header-visual">
              <div class="dhv-item dhv-folder"><i data-lucide="folder"></i><span>Files</span></div>
              <div class="dhv-connector"><i data-lucide="chevron-right"></i></div>
              <div class="dhv-item dhv-cube"><i data-lucide="box"></i><span>Blockchain</span></div>
              <div class="dhv-connector"><i data-lucide="chevron-right"></i></div>
              <div class="dhv-item dhv-shield"><i data-lucide="shield"></i><span>Security</span></div>
              <div class="dhv-connector"><i data-lucide="chevron-right"></i></div>
              <div class="dhv-item dhv-gavel"><i data-lucide="scale"></i><span>Court</span></div>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="doc-search-bar">
          <div class="doc-search-field">
            <i data-lucide="search"></i>
            <input type="text" class="doc-search-input" placeholder="Search documentation, guides, APIs, workflows..." aria-label="Search documentation">
            <span class="doc-search-kbd"><i data-lucide="command"></i>K</span>
            <div class="doc-search-suggestions"></div>
          </div>
        </div>

        <!-- Stats Overview -->
        <div class="doc-stats-row" id="docStats"></div>

        <!-- Pinned Section -->
        <div class="doc-pinned-row" id="docPinned"></div>

        <!-- Two-Column Workspace -->
        <div class="doc-body">
          <aside class="doc-cabinet" id="docCabinet">
            <div class="cabinet-header">
              <i data-lucide="folder-tree"></i>
              <span>Evidence File Cabinet</span>
            </div>
            <div class="cabinet-list" id="cabinetList"></div>
          </aside>
          <main class="doc-viewer" id="docViewer">
            <div class="doc-viewer-empty">
              <div class="dve-icon"><i data-lucide="folder-open"></i></div>
              <h3>Select a guide to begin</h3>
              <p>Choose a file from the Evidence File Cabinet to view its documentation.</p>
              <div class="dve-suggestions">
                <span>Quick links:</span>
                <button class="dve-quick" data-item="overview">Overview</button>
                <button class="dve-quick" data-item="all-roles">User Roles</button>
                <button class="dve-quick" data-item="common-issues">Troubleshooting</button>
              </div>
            </div>
          </main>
        </div>

        <!-- Bottom Resources -->
        <div class="doc-resources-bottom" id="docResources"></div>
      </div>
    `;

    this.sidebarEl = document.getElementById('cabinetList');
    this.viewerEl = document.getElementById('docViewer');
    this.searchInput = this.container.querySelector('.doc-search-input');

    this.renderStats();
    this.renderPinned();
    this.renderSidebar();
    this.renderResources();
    this.showWelcome();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  renderStats() {
    const statsEl = document.getElementById('docStats');
    if (!statsEl) return;
    const stats = [
      { icon: 'file-text', label: 'Guides', value: DOC_DATA.guides },
      { icon: 'git-branch', label: 'Workflows', value: DOC_DATA.workflows },
      { icon: 'users', label: 'User Roles', value: '8' },
      { icon: 'code', label: 'API Endpoints', value: DOC_DATA.endpoints },
      { icon: 'shield', label: 'Security Modules', value: DOC_DATA.security },
      { icon: 'server', label: 'Architecture Components', value: DOC_DATA.architecture },
      { icon: 'link', label: 'Blockchain Integrations', value: DOC_DATA.integrations },
      { icon: 'clock', label: 'Last Updated', value: DOC_DATA.released }
    ];
    statsEl.innerHTML = stats.map(s => `
      <div class="doc-stat-card">
        <div class="dsc-icon"><i data-lucide="${s.icon}"></i></div>
        <div class="dsc-info">
          <span class="dsc-value">${s.value}</span>
          <span class="dsc-label">${s.label}</span>
        </div>
      </div>
    `).join('');
  }

  renderPinned() {
    const pinnedEl = document.getElementById('docPinned');
    if (!pinnedEl) return;
    const recent = this.state.recentlyViewed.slice(0, 3);
    const bookmarks = this.state.bookmarks.slice(0, 3);
    let html = '';

    if (recent.length > 0) {
      html += `<div class="doc-pinned-group"><div class="dpg-header"><i data-lucide="clock"></i><span>Recently Viewed</span></div><div class="dpg-items">${recent.map(r => `<button class="dpg-item" data-folder="${r.folder}" data-item="${r.item}"><i data-lucide="file-text"></i><span>${r.title}</span></button>`).join('')}</div></div>`;
    }
    if (bookmarks.length > 0) {
      html += `<div class="doc-pinned-group"><div class="dpg-header"><i data-lucide="bookmark"></i><span>Bookmarks</span></div><div class="dpg-items">${bookmarks.map(b => `<button class="dpg-item" data-folder="${b.folder}" data-item="${b.item}"><i data-lucide="bookmark"></i><span>${b.title}</span></button>`).join('')}</div></div>`;
    }
    if (!html) {
      html = `<div class="doc-pinned-empty"><i data-lucide="book-open"></i><span>Start browsing to see recently viewed guides and bookmarks here.</span></div>`;
    }
    pinnedEl.innerHTML = html;
  }

  renderSidebar() {
    if (!this.sidebarEl) return;
    this.sidebarEl.innerHTML = DOC_DATA.folders.map(f => `
      <div class="cabinet-folder" data-folder="${f.id}">
        <div class="cf-header">
          <div class="cf-icon"><i data-lucide="${f.icon}"></i></div>
          <div class="cf-info">
            <span class="cf-title">${f.title}</span>
            <span class="cf-subtitle">${f.subtitle}</span>
          </div>
          <div class="cf-chevron"><i data-lucide="chevron-down"></i></div>
        </div>
        <div class="cf-items">
          ${f.items.map(item => `
            <button class="cf-item" data-folder="${f.id}" data-item="${item.id}">
              <i data-lucide="${item.icon}"></i>
              <span>${item.title}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  renderResources() {
    const resEl = document.getElementById('docResources');
    if (!resEl) return;
    const resources = [
      { icon: 'terminal', title: 'Developer Resources', items: ['Smart Contract Documentation', 'REST APIs', 'SDK & Tools', 'Database Schema'], expanded: false },
      { icon: 'scale', title: 'Legal Resources', items: ['Court Reports Guide', 'Chain of Custody Forms', 'Evidence Standards', 'Compliance Checklist'], expanded: false },
      { icon: 'graduation-cap', title: 'Learning Resources', items: ['Video Tutorials', 'Interactive Guides', 'Sample Cases', 'Best Practices'], expanded: false },
      { icon: 'puzzle', title: 'API Tools', items: ['Postman Collection', 'Swagger Docs', 'Webhook Examples', 'Rate Limits'], expanded: false },
      { icon: 'lock', title: 'Security Standards', items: ['Encryption Overview', 'Access Control Guide', 'Audit Log Reference', 'Incident Response'], expanded: false },
      { icon: 'check-circle', title: 'Compliance', items: ['ISO 27037', 'NIST Framework', 'GDPR Compliance', 'SWGDE Standards'], expanded: false }
    ];
    resEl.innerHTML = resources.map(r => `
      <div class="doc-res-panel">
        <div class="drp-header">
          <i data-lucide="${r.icon}"></i>
          <h4>${r.title}</h4>
          <i data-lucide="chevron-down" class="drp-chevron"></i>
        </div>
        <div class="drp-body">
          <ul>${r.items.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
      </div>
    `).join('');
  }

  showWelcome() {
    if (!this.viewerEl) return;
    const recent = this.state.recentlyViewed;
    if (recent.length > 0) {
      const last = recent[0];
      this.loadContent(last.folder, last.item);
    }
  }

  loadContent(folderId, itemId) {
    const folder = DOC_DATA.folders.find(f => f.id === folderId);
    if (!folder) return;
    const item = folder.items.find(i => i.id === itemId);
    if (!item) return;

    this.state.activeFolder = folderId;
    this.state.activeItem = itemId;

    this.updateSidebarActive(folderId, itemId);
    this.addToRecentlyViewed(folderId, itemId, item.title);

    if (!this.viewerEl) return;
    this.viewerEl.innerHTML = `
      <div class="doc-content animate-in">
        <div class="doc-content-top">
          <div class="dc-breadcrumb">${item.breadcrumb.map((b, i) => `<span${i === item.breadcrumb.length - 1 ? ' class="active"' : ''}>${b}</span>${i < item.breadcrumb.length - 1 ? '<i data-lucide="chevron-right"></i>' : ''}`).join('')}</div>
          <div class="dc-meta">
            <span class="dc-version">${DOC_DATA.version}</span>
            <span class="dc-divider">|</span>
            <span><i data-lucide="clock"></i> ${item.readingTime} read</span>
            <span class="dc-divider">|</span>
            <span><i data-lucide="calendar"></i> ${item.lastUpdated}</span>
            <button class="dc-bookmark-btn ${this.state.bookmarks.some(b => b.folder === folderId && b.item === itemId) ? 'bookmarked' : ''}" data-folder="${folderId}" data-item="${itemId}" title="Bookmark this page"><i data-lucide="bookmark"></i></button>
            <button class="dc-share-btn" onclick="navigator.clipboard.writeText(window.location.href.split('#')[0] + '#documentation'); if(typeof lucide !== 'undefined') lucide.createIcons();" title="Copy link"><i data-lucide="share-2"></i></button>
          </div>
        </div>
        <div class="doc-content-body">${item.content}</div>
        <div class="doc-content-nav">
          ${this.getPrevNext(folderId, itemId)}
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.viewerEl.scrollTop = 0;

    setTimeout(() => {
      const content = this.viewerEl.querySelector('.doc-content');
      if (content) content.classList.add('animate-in-active');
    }, 50);
  }

  updateSidebarActive(folderId, itemId) {
    this.sidebarEl.querySelectorAll('.cabinet-folder').forEach(f => {
      const fid = f.dataset.folder;
      f.classList.toggle('active', fid === folderId);
      f.querySelectorAll('.cf-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.folder === folderId && btn.dataset.item === itemId);
      });
      const items = f.querySelector('.cf-items');
      if (items) items.style.maxHeight = fid === folderId ? items.scrollHeight + 'px' : null;
    });
  }

  addToRecentlyViewed(folderId, itemId, title) {
    const recent = this.state.recentlyViewed.filter(r => !(r.folder === folderId && r.item === itemId));
    recent.unshift({ folder: folderId, item: itemId, title, time: Date.now() });
    if (recent.length > 5) recent.length = 5;
    this.state.recentlyViewed = recent;
    localStorage.setItem('evid-doc-recent', JSON.stringify(recent));
    this.renderPinned();
  }

  getPrevNext(folderId, itemId) {
    const folder = DOC_DATA.folders.find(f => f.id === folderId);
    if (!folder) return '';
    const idx = folder.items.findIndex(i => i.id === itemId);
    const prev = idx > 0 ? folder.items[idx - 1] : null;
    const next = idx < folder.items.length - 1 ? folder.items[idx + 1] : null;

    let html = '<div class="dc-nav-prevnext">';
    if (prev) {
      html += `<button class="dc-nav-btn prev" data-folder="${folderId}" data-item="${prev.id}"><i data-lucide="arrow-left"></i><span><small>Previous</small>${prev.title}</span></button>`;
    } else {
      html += '<div></div>';
    }
    if (next) {
      html += `<button class="dc-nav-btn next" data-folder="${folderId}" data-item="${next.id}"><span><small>Next</small>${next.title}</span><i data-lucide="arrow-right"></i></button>`;
    } else {
      html += '<div></div>';
    }
    html += '</div>';

    const pdfContent = encodeURIComponent(`EVID-DGC: ${folder.title} - ${folder.items.find(i => i.id === itemId)?.title}`);
    html += `<div class="dc-nav-actions">
      <button class="dc-action-btn" onclick="alert('PDF download initiated')" title="Download PDF"><i data-lucide="file-down"></i><span>PDF</span></button>
      <button class="dc-action-btn" onclick="window.print()" title="Print"><i data-lucide="printer"></i><span>Print</span></button>
      <button class="dc-action-btn" onclick="alert('Evidence report generated')" title="Evidence Report"><i data-lucide="file-text"></i><span>Report</span></button>
    </div>`;
    return html;
  }

  search(query) {
    if (!query || query.length < 2) {
      this.hideSuggestions();
      return;
    }
    const q = query.toLowerCase();
    const results = [];
    DOC_DATA.folders.forEach(f => {
      f.items.forEach(item => {
        if (item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)) {
          results.push({ folder: f.id, item: item.id, title: item.title, folderTitle: f.title });
        }
      });
    });
    this.showSuggestions(results, query);
  }

  showSuggestions(results, query) {
    const el = this.container.querySelector('.doc-search-suggestions');
    if (!el) return;
    if (results.length === 0) {
      el.innerHTML = `<div class="dss-empty"><i data-lucide="search-x"></i><span>No results found for "${query}"</span></div>`;
      el.classList.add('visible');
      return;
    }
    el.innerHTML = `<div class="dss-header">${results.length} guide${results.length > 1 ? 's' : ''} found</div>
      ${results.slice(0, 8).map(r => `<button class="dss-item" data-folder="${r.folder}" data-item="${r.item}"><i data-lucide="file-text"></i><div><span>${this.highlightMatch(r.title, query)}</span><small>${r.folderTitle}</small></div></button>`).join('')}`;
    el.classList.add('visible');
  }

  highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  hideSuggestions() {
    const el = this.container.querySelector('.doc-search-suggestions');
    if (el) el.classList.remove('visible');
  }

  attachEvents() {
    document.addEventListener('click', (e) => {
      const folder = e.target.closest('.cf-header');
      if (folder && this.sidebarEl && this.sidebarEl.contains(folder)) {
        const parent = folder.closest('.cabinet-folder');
        if (parent) {
          parent.classList.toggle('expanded');
          const items = parent.querySelector('.cf-items');
          if (items) {
            items.style.maxHeight = parent.classList.contains('expanded') ? items.scrollHeight + 'px' : null;
          }
        }
        return;
      }

      const itemBtn = e.target.closest('.cf-item');
      if (itemBtn) {
        this.loadContent(itemBtn.dataset.folder, itemBtn.dataset.item);
        return;
      }

      const quickBtn = e.target.closest('.dve-quick');
      if (quickBtn) {
        const itemId = quickBtn.dataset.item;
        for (const f of DOC_DATA.folders) {
          const found = f.items.find(i => i.id === itemId);
          if (found) { this.loadContent(f.id, itemId); break; }
        }
        return;
      }

      const navBtn = e.target.closest('.dc-nav-btn');
      if (navBtn) {
        this.loadContent(navBtn.dataset.folder, navBtn.dataset.item);
        return;
      }

      const pinnedBtn = e.target.closest('.dpg-item');
      if (pinnedBtn) {
        this.loadContent(pinnedBtn.dataset.folder, pinnedBtn.dataset.item);
        return;
      }

      const bookmarkBtn = e.target.closest('.dc-bookmark-btn');
      if (bookmarkBtn) {
        bookmarkBtn.classList.toggle('bookmarked');
        const { folder, item } = bookmarkBtn.dataset;
        const folderObj = DOC_DATA.folders.find(f => f.id === folder);
        const itemObj = folderObj?.items.find(i => i.id === item);
        if (!itemObj) return;
        if (bookmarkBtn.classList.contains('bookmarked')) {
          if (!this.state.bookmarks.some(b => b.folder === folder && b.item === item)) {
            this.state.bookmarks.push({ folder, item, title: itemObj.title });
          }
        } else {
          this.state.bookmarks = this.state.bookmarks.filter(b => !(b.folder === folder && b.item === item));
        }
        localStorage.setItem('evid-doc-bookmarks', JSON.stringify(this.state.bookmarks));
        this.renderPinned();
        return;
      }

      const suggItem = e.target.closest('.dss-item');
      if (suggItem) {
        this.loadContent(suggItem.dataset.folder, suggItem.dataset.item);
        this.hideSuggestions();
        if (this.searchInput) this.searchInput.value = '';
        return;
      }

      const resPanel = e.target.closest('.doc-res-panel');
      if (resPanel) {
        resPanel.classList.toggle('expanded');
        const body = resPanel.querySelector('.drp-body');
        if (body) {
          body.style.maxHeight = resPanel.classList.contains('expanded') ? body.scrollHeight + 'px' : null;
        }
        return;
      }

      const actionBtn = e.target.closest('.dc-action-btn');
      if (actionBtn) {
        const span = actionBtn.querySelector('span');
        if (span && span.textContent === 'Report') {
          const folder = DOC_DATA.folders.find(f => f.id === this.state.activeFolder);
          const item = folder?.items.find(i => i.id === this.state.activeItem);
          if (item) {
            const win = window.open('', '_blank');
            if (win) {
              win.document.write(`<!DOCTYPE html><html><head><title>EVID-DGC Evidence Report</title><style>body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6}h1{color:#1a1a1a}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #d32f2f;padding-bottom:16px;margin-bottom:24px}.badge{background:#d32f2f;color:#fff;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb}th{background:#fef2f2;font-weight:600}.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:14px;color:#6b7280}</style></head><body><div class="header"><h1>Evidence Report</h1><span class="badge">EVID-DGC</span></div><table><tr><th>Document</th><td>${item.title}</td></tr><tr><th>Section</th><td>${folder.title}</td></tr><tr><th>Version</th><td>${DOC_DATA.version}</td></tr><tr><th>Last Updated</th><td>${item.lastUpdated}</td></tr><tr><th>Reading Time</th><td>${item.readingTime}</td></tr><tr><th>System</th><td>EVID-DGC v${DOC_DATA.version}</td></tr><tr><th>Generated</th><td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr></table><div class="footer"><p>EVID-DGC — Evidence Digital Guardian Controller</p><p>Blockchain-Based Digital Evidence Management System</p></div></body></html>`);
              win.document.close();
            }
          }
        }
        return;
      }

      if (!e.target.closest('.doc-search-field')) {
        this.hideSuggestions();
      }
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.search(e.target.value);
      });
      this.searchInput.addEventListener('focus', (e) => {
        if (e.target.value.length >= 2) this.search(e.target.value);
      });
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { this.searchInput.blur(); this.hideSuggestions(); }
        if (e.key === 'Enter') {
          const visible = this.container.querySelector('.dss-item');
          if (visible) { visible.click(); }
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (this.searchInput) this.searchInput.focus();
      }
    });
  }
}

let docManagerInstance = null;
function initializeDocumentation() {
  if (docManagerInstance) return;
  if (!document.getElementById('documentation')) { setTimeout(initializeDocumentation, 200); return; }
  docManagerInstance = new DocumentationManager();
  docManagerInstance.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initializeDocumentation, 300));
} else {
  setTimeout(initializeDocumentation, 300);
}
