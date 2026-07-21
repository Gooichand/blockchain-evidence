/* ===========================================
   Q&A Knowledge Center - Enterprise Help Center v2
   =========================================== */

const QA_DATA = {
  stats: {
    questions: 40,
    guides: 27,
    roles: 8,
    security: 6,
    endpoints: 12,
    lastUpdated: 'Mar 2026'
  },
  categories: [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'getting-started', label: 'Getting Started', icon: 'rocket' },
    { id: 'evidence', label: 'Evidence', icon: 'folder' },
    { id: 'blockchain', label: 'Blockchain', icon: 'link' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'legal', label: 'Legal', icon: 'scale' },
    { id: 'api', label: 'API', icon: 'code' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: 'wrench' },
    { id: 'account', label: 'Account', icon: 'user' },
    { id: 'general', label: 'General', icon: 'help-circle' }
  ],
  questions: [
    // --- Getting Started ---
    {
      id: 'what-is-evid',
      category: 'getting-started',
      question: 'What is EVID-DGC?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC (Evidence Digital Guardian Controller) is a blockchain-based digital evidence management system designed for law enforcement, forensic laboratories, prosecutors, and courts.</p>
        <p>The system ensures evidence integrity through <strong>SHA-256 hashing</strong>, <strong>IPFS decentralized storage</strong>, and <strong>Polygon blockchain verification</strong>. Every piece of evidence is cryptographically sealed with an immutable audit trail.</p>
        <ul>
          <li>Secure evidence upload with automatic hashing</li>
          <li>Blockchain-based verification and chain of custody</li>
          <li>Role-based access control for different user types</li>
          <li>Court-ready evidence reports with blockchain proof</li>
        </ul>
      `,
      related: [
        { label: 'Getting Started Guide', action: 'doc:overview' },
        { label: 'System Architecture', action: 'doc:frontend' }
      ]
    },
    {
      id: 'create-case',
      category: 'getting-started',
      question: 'How do I create my first case?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Creating a case in EVID-DGC is straightforward:</p>
        <ol>
          <li>Log in to your dashboard using MetaMask or email authentication</li>
          <li>Click the <strong>"New Case"</strong> button on your dashboard</li>
          <li>Fill in case details: case number, title, description, and jurisdiction</li>
          <li>Assign investigators and set the case priority</li>
          <li>Submit — the case is recorded on the blockchain</li>
        </ol>
        <p>Once created, you can immediately begin uploading evidence to the case.</p>
      `,
      related: [
        { label: 'Evidence Workflow', action: 'doc:case-creation' },
        { label: 'User Roles Guide', action: 'doc:all-roles' }
      ]
    },
    {
      id: 'upload-evidence',
      category: 'getting-started',
      question: 'How do I upload evidence?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Uploading evidence is a simple process with automatic blockchain verification:</p>
        <ol>
          <li>Navigate to your case and click <strong>"Upload Evidence"</strong></li>
          <li>Select the file(s) from your device</li>
          <li>Add metadata: description, file type, source, collector name</li>
          <li>The system automatically computes a SHA-256 hash of the file</li>
          <li>The file is uploaded to IPFS and the hash is recorded on Polygon blockchain</li>
          <li>You will receive a confirmation with the blockchain transaction ID</li>
        </ol>
        <div class="qa-callout qa-callout-info"><i data-lucide="info"></i><div>The entire hashing and blockchain recording process happens automatically — no manual blockchain knowledge required.</div></div>
      `,
      related: [
        { label: 'Evidence Upload Guide', action: 'doc:evidence-upload' },
        { label: 'Supported Formats', action: 'doc:evidence-collection' }
      ]
    },
    {
      id: 'file-formats',
      category: 'getting-started',
      question: 'Which file formats and sizes are supported?',
      readingTime: '2 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>EVID-DGC supports a wide range of digital evidence file formats:</p>
        <ul>
          <li><strong>Images:</strong> JPEG, PNG, GIF, TIFF, BMP, WebP</li>
          <li><strong>Videos:</strong> MP4, AVI, MOV, MKV, WebM</li>
          <li><strong>Audio:</strong> MP3, WAV, AAC, FLAC, OGG</li>
          <li><strong>Documents:</strong> PDF, DOC, DOCX, XLS, XLSX, TXT, RTF</li>
          <li><strong>Archives:</strong> ZIP, RAR, 7Z, TAR, GZ</li>
          <li><strong>Forensic:</strong> E01, DD, AFF, L01</li>
        </ul>
        <p><strong>Maximum file size:</strong> 50MB per file. For larger files, please contact your administrator.</p>
      `,
      related: [
        { label: 'Evidence Collection', action: 'doc:evidence-collection' }
      ]
    },
    {
      id: 'what-roles',
      category: 'getting-started',
      question: 'What user roles exist in EVID-DGC?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC supports <strong>eight distinct roles</strong>, each with specific permissions:</p>
        <div class="qa-table-wrap"><table class="qa-table"><thead><tr><th>Role</th><th>Access</th><th>Primary Function</th></tr></thead><tbody>
        <tr><td>Public</td><td>View Only</td><td>Verify evidence authenticity</td></tr>
        <tr><td>Investigator</td><td>Create, Upload, View</td><td>Collect and submit evidence</td></tr>
        <tr><td>Analyst</td><td>Analyze, View</td><td>Forensic analysis and reporting</td></tr>
        <tr><td>Legal</td><td>Review, View</td><td>Legal review and case preparation</td></tr>
        <tr><td>Court</td><td>Verify, View</td><td>Evidence verification for proceedings</td></tr>
        <tr><td>Manager</td><td>Manage, Assign</td><td>Case management and oversight</td></tr>
        <tr><td>Auditor</td><td>Audit, View</td><td>Compliance and audit review</td></tr>
        <tr><td>Admin</td><td>Full Access</td><td>System administration</td></tr>
        </tbody></table></div>
      `,
      related: [
        { label: 'User Roles Documentation', action: 'doc:all-roles' },
        { label: 'Permissions Matrix', action: 'doc:permissions' }
      ]
    },

    // --- Evidence ---
    {
      id: 'verify-evidence',
      category: 'evidence',
      question: 'How is evidence verified?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Evidence verification in EVID-DGC works through a multi-layered cryptographic process:</p>
        <ol>
          <li><strong>SHA-256 Hashing:</strong> Each file is hashed at upload, creating a unique digital fingerprint</li>
          <li><strong>IPFS Storage:</strong> The file is stored on IPFS and assigned a content identifier (CID)</li>
          <li><strong>Blockchain Recording:</strong> The hash and CID are recorded in a Polygon blockchain transaction</li>
          <li><strong>Public Verification:</strong> Anyone can verify evidence by computing the hash and checking it against the blockchain record</li>
        </ol>
        <p>The entire verification process is public and does not require a wallet or login. Simply visit the verification page and enter the evidence ID or upload the file.</p>
      `,
      related: [
        { label: 'Verification Process', action: 'doc:verification' },
        { label: 'Blockchain Guide', action: 'doc:blockchain' }
      ]
    },
    {
      id: 'edit-evidence',
      category: 'evidence',
      question: 'Can evidence be edited or modified after upload?',
      popular: true,
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>No.</strong> Once evidence is uploaded and verified, it becomes <strong>immutable</strong> on the blockchain. This is a core feature of EVID-DGC — it ensures the integrity of the chain of custody.</p>
        <p>However, authorized users can:</p>
        <ul>
          <li>Add annotations or status updates (recorded as separate blockchain transactions)</li>
          <li>Transfer custody to another authorized user</li>
          <li>Add or update case metadata</li>
        </ul>
        <p>The original evidence file and its hash remain unchanged forever.</p>
      `,
      related: [
        { label: 'Chain of Custody', action: 'doc:chain-of-custody' },
        { label: 'Tamper Proof System', action: 'doc:tamper-proof' }
      ]
    },
    {
      id: 'delete-evidence',
      category: 'evidence',
      question: 'Can evidence be deleted?',
      readingTime: '1 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>Evidence <strong>cannot be deleted</strong> from the blockchain. The hash record is permanent and immutable.</p>
        <p>This is intentional — it ensures that no evidence can be destroyed or tampered with without detection. The blockchain provides a permanent, verifiable record that the evidence existed at a specific point in time.</p>
        <p>Administrators can mark evidence as "archived" or "inactive," but the underlying blockchain record remains.</p>
      `,
      related: [
        { label: 'Legal Hold', action: 'doc:legal-hold' }
      ]
    },
    {
      id: 'evidence-transfer',
      category: 'evidence',
      question: 'How does evidence transfer between users work?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Evidence custody transfers are recorded as blockchain transactions:</p>
        <ol>
          <li>The current custodian initiates a transfer request</li>
          <li>The receiving user accepts the custody</li>
          <li>A blockchain transaction records: timestamp, from user, to user, evidence ID</li>
          <li>The chain of custody is updated with the new link</li>
        </ol>
        <p>Every transfer is permanently recorded and verifiable. The complete custody history is available for audit at any time.</p>
      `,
      related: [
        { label: 'Chain of Custody', action: 'doc:chain-of-custody' },
        { label: 'Audit Trail', action: 'doc:audit-trail' }
      ]
    },
    {
      id: 'generate-reports',
      category: 'evidence',
      question: 'How are court-ready reports generated?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC can generate comprehensive court-ready evidence reports:</p>
        <ol>
          <li>Navigate to the evidence you want to report</li>
          <li>Click <strong>"Generate Report"</strong></li>
          <li>The report includes: evidence metadata, SHA-256 hash, IPFS CID, blockchain transaction IDs, complete chain of custody timeline</li>
          <li>Export as PDF with a QR code for instant blockchain verification</li>
        </ol>
        <p>Reports are formatted to meet court evidence admissibility standards.</p>
      `,
      related: [
        { label: 'Court Reports', action: 'doc:court-reports' }
      ]
    },

    // --- Blockchain ---
    {
      id: 'why-blockchain',
      category: 'blockchain',
      question: 'Why use blockchain for evidence management?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Blockchain technology provides three critical properties for evidence management:</p>
        <ul>
          <li><strong>Immutability:</strong> Once data is recorded, it cannot be altered or deleted</li>
          <li><strong>Transparency:</strong> Anyone can verify evidence authenticity without relying on a central authority</li>
          <li><strong>Decentralization:</strong> No single point of failure or control</li>
        </ul>
        <p>Traditional evidence management systems rely on database administrators who could theoretically alter records. Blockchain eliminates this risk by distributing trust across the network.</p>
      `,
      related: [
        { label: 'Blockchain Architecture', action: 'doc:blockchain' },
        { label: 'Smart Contracts', action: 'doc:smart-contracts' }
      ]
    },
    {
      id: 'why-polygon',
      category: 'blockchain',
      question: 'Why is EVID-DGC built on Polygon?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC uses the <strong>Polygon network</strong> for several key reasons:</p>
        <ul>
          <li><strong>Low Transaction Fees:</strong> Cost-effective for recording evidence hashes (fractions of a cent)</li>
          <li><strong>Fast Finality:</strong> Transactions confirm in 2-3 seconds</li>
          <li><strong>Ethereum Compatible:</strong> Full EVM compatibility means all Ethereum tooling works</li>
          <li><strong>Scalable:</strong> Handles high throughput for enterprise usage</li>
          <li><strong>Proven Security:</strong> Backed by Polygon's battle-tested infrastructure</li>
        </ul>
        <p><strong>Testnet:</strong> Polygon Amoy (Chain ID: 0x13882)</p>
        <p><strong>Mainnet:</strong> Polygon PoS (Chain ID: 0x89)</p>
      `,
      related: [
        { label: 'Polygon Network', action: 'doc:polygon' },
        { label: 'Network Config', action: 'doc:networks' }
      ]
    },
    {
      id: 'what-is-sha256',
      category: 'blockchain',
      question: 'What is SHA-256 and why is it used?',
      popular: true,
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>SHA-256</strong> (Secure Hash Algorithm 256-bit) is a cryptographic hash function that produces a unique 256-bit (32-byte) digital fingerprint for any input data.</p>
        <p>Key properties:</p>
        <ul>
          <li><strong>Collision-resistant:</strong> No two different inputs produce the same hash</li>
          <li><strong>One-way:</strong> The original data cannot be derived from the hash</li>
          <li><strong>Deterministic:</strong> Same input always produces the same hash</li>
        </ul>
        <p>In EVID-DGC, every evidence file is hashed at upload. This hash is recorded on the blockchain, providing a permanent, verifiable fingerprint. If the file is altered even by one byte, the hash will change, immediately detecting tampering.</p>
      `,
      related: [
        { label: 'SHA-256 Guide', action: 'doc:sha256' },
        { label: 'Tamper Proof System', action: 'doc:tamper-proof' }
      ]
    },
    {
      id: 'what-is-ipfs',
      category: 'blockchain',
      question: 'What is IPFS and how does it store evidence?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>IPFS</strong> (InterPlanetary File System) is a decentralized, peer-to-peer file storage network. Unlike traditional HTTP storage (which uses location-based addressing), IPFS uses <strong>content-based addressing</strong>.</p>
        <p>How it works in EVID-DGC:</p>
        <ol>
          <li>When evidence is uploaded, the file is split into chunks and content-addressed</li>
          <li>Each chunk receives a cryptographic hash</li>
          <li>The file is assigned a unique Content Identifier (CID)</li>
          <li>The CID is stored alongside the SHA-256 hash on the blockchain</li>
        </ol>
        <p>Benefits: files cannot be altered without changing their CID, there is no single point of failure, and anyone can verify file integrity.</p>
      `,
      related: [
        { label: 'IPFS Deep Dive', action: 'doc:ipfs-deep' },
        { label: 'IPFS Architecture', action: 'doc:ipfs' }
      ]
    },
    {
      id: 'hash-verification',
      category: 'blockchain',
      question: 'How is hash verification performed?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Hash verification in EVID-DGC works in two ways:</p>
        <h4>Automatic Verification</h4>
        <p>Every time evidence is accessed, the system re-computes the SHA-256 hash and compares it with the blockchain record. If they match, the evidence is verified.</p>
        <h4>Public Verification</h4>
        <p>Anyone can verify evidence without a wallet or login:</p>
        <ol>
          <li>Go to the Public Verification page</li>
          <li>Upload the evidence file or enter the evidence ID</li>
          <li>The system computes the SHA-256 hash</li>
          <li>Queries the Polygon blockchain for a matching record</li>
          <li>Returns: <strong>Verified</strong> or <strong>Not Verified</strong> with the timestamp</li>
        </ol>
      `,
      related: [
        { label: 'Verification Process', action: 'doc:verification' },
        { label: 'SHA-256 Guide', action: 'doc:sha256' }
      ]
    },
    {
      id: 'tampering-detection',
      category: 'blockchain',
      question: 'How is tampering detected?',
      popular: true,
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Tampering is detected through a <strong>multi-layered security approach</strong>:</p>
        <ol>
          <li><strong>Hash Mismatch:</strong> If the evidence file is altered, re-computing the SHA-256 hash will produce a different value than what is recorded on the blockchain</li>
          <li><strong>Blockchain Verification Failure:</strong> The blockchain query will return "Not Verified" if the hashes don't match</li>
          <li><strong>Chain of Custody Break:</strong> Any unauthorized access or transfer is detected through the audit trail</li>
          <li><strong>IPFS CID Change:</strong> If the file stored on IPFS is altered, its CID changes, which won't match the blockchain record</li>
        </ol>
        <p>These layers ensure that tampering is <strong>immediately detectable</strong> and permanently recorded.</p>
      `,
      related: [
        { label: 'Tamper Proof System', action: 'doc:tamper-proof' },
        { label: 'Security Overview', action: 'doc:sha256' }
      ]
    },

    // --- Security ---
    {
      id: 'encryption',
      category: 'security',
      question: 'Is my evidence encrypted?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>Yes.</strong> Evidence in EVID-DGC is protected by multiple layers of encryption:</p>
        <ul>
          <li><strong>In Transit:</strong> All communications are secured via HTTPS/TLS. API endpoints use JWT token authentication.</li>
          <li><strong>At Rest:</strong> Evidence files stored on IPFS are encrypted using AES-256. Database records are encrypted at the application level.</li>
          <li><strong>Blockchain:</strong> Hash records on Polygon are cryptographically signed and immutable.</li>
        </ul>
        <p>Additionally, your MetaMask private keys are never transmitted to our servers. We use zero-knowledge authentication to protect your privacy.</p>
      `,
      related: [
        { label: 'Encryption Standards', action: 'doc:encryption' },
        { label: 'Security Overview', action: 'doc:sha256' }
      ]
    },
    {
      id: 'what-is-rbac',
      category: 'security',
      question: 'What is Role-Based Access Control (RBAC)?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>RBAC</strong> (Role-Based Access Control) is a security model where access permissions are assigned based on a user's role within the organization.</p>
        <p>In EVID-DGC, each role has granular permissions that determine what actions can be performed:</p>
        <ul>
          <li><strong>Public:</strong> Verify evidence only</li>
          <li><strong>Investigator:</strong> Upload evidence, create cases</li>
          <li><strong>Analyst:</strong> Analyze evidence, generate reports</li>
          <li><strong>Legal:</strong> Review evidence for legal proceedings</li>
          <li><strong>Court:</strong> Verify evidence during trials</li>
          <li><strong>Manager:</strong> Oversee cases, assign tasks</li>
          <li><strong>Auditor:</strong> Review audit logs for compliance</li>
          <li><strong>Admin:</strong> Full system access</li>
        </ul>
      `,
      related: [
        { label: 'Permissions Matrix', action: 'doc:permissions' },
        { label: 'Access Control', action: 'doc:access-control' }
      ]
    },
    {
      id: 'audit-logs-immutable',
      category: 'security',
      question: 'Are audit logs truly immutable?',
      readingTime: '1 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>Yes.</strong> All audit logs in EVID-DGC are recorded on the Polygon blockchain, making them truly immutable.</p>
        <p>Every action — evidence upload, access, transfer, verification, and report generation — creates a blockchain transaction that cannot be altered or deleted. This provides:</p>
        <ul>
          <li>Complete accountability for all actions</li>
          <li>Court-admissible evidence of proper handling</li>
          <li>Independent verification by auditors or external parties</li>
        </ul>
      `,
      related: [
        { label: 'Audit Trail', action: 'doc:audit-trail' },
        { label: 'Chain of Custody', action: 'doc:chain-of-custody' }
      ]
    },
    {
      id: 'admin-evidence-changes',
      category: 'security',
      question: 'Can administrators change or delete evidence?',
      readingTime: '2 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p><strong>No.</strong> Even administrators cannot modify or delete blockchain records. This is a fundamental security feature of EVID-DGC.</p>
        <p>Administrators have full system access for management purposes, but the blockchain layer ensures that:</p>
        <ul>
          <li>Evidence hashes remain permanent and unchangeable</li>
          <li>All admin actions are also recorded on the blockchain</li>
          <li>Any attempt to tamper with records is immediately detectable</li>
        </ul>
        <p>This "separation of powers" ensures that no single person can compromise the integrity of evidence.</p>
      `,
      related: [
        { label: 'Access Control', action: 'doc:access-control' },
        { label: 'Admin Role', action: 'doc:all-roles' }
      ]
    },
    {
      id: 'authentication-security',
      category: 'security',
      question: 'How is authentication secured?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC supports two authentication methods, both highly secure:</p>
        <h4>MetaMask Wallet Authentication</h4>
        <ul>
          <li>Uolves cryptographic signatures instead of passwords</li>
          <li>Your private key never leaves your computer</li>
          <li>Each session requires a unique signed message</li>
        </ul>
        <h4>Email & Password</h4>
        <ul>
          <li>Passwords are hashed using bcrypt before storage</li>
          <li>JWT tokens with automatic expiration</li>
          <li>Optional two-factor authentication (2FA)</li>
          <li>Session timeout after period of inactivity</li>
        </ul>
      `,
      related: [
        { label: 'Access Control', action: 'doc:access-control' },
        { label: 'Setup Guide', action: 'doc:setup' }
      ]
    },

    // --- Legal ---
    {
      id: 'chain-of-custody',
      category: 'legal',
      question: 'What is the Chain of Custody and how is it maintained?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>The <strong>Chain of Custody</strong> is a documented record that traces the sequence of custody, control, transfer, and disposition of evidence from collection to courtroom presentation.</p>
        <p>In EVID-DGC, the chain of custody is maintained through:</p>
        <ul>
          <li><strong>Blockchain Transactions:</strong> Every access, transfer, or action creates a permanent blockchain record</li>
          <li><strong>Timestamped Logs:</strong> Each entry includes the exact timestamp, user identity, and action performed</li>
          <li><strong>Cryptographic Linking:</strong> Each custody link references the previous one, creating an unbreakable chain</li>
          <li><strong>Digital Signatures:</strong> All actions are cryptographically signed by the user's wallet</li>
        </ul>
        <p>The complete custody history is available for audit and meets court evidence admissibility standards.</p>
      `,
      related: [
        { label: 'Chain of Custody Guide', action: 'doc:chain-of-custody' },
        { label: 'Court Reports', action: 'doc:court-reports' }
      ]
    },
    {
      id: 'court-ready',
      category: 'legal',
      question: 'Is EVID-DGC evidence court-ready and admissible?',
      popular: true,
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>Yes.</strong> Evidence managed through EVID-DGC is designed to meet court admissibility standards:</p>
        <ul>
          <li>Blockchain verification provides an independently verifiable record of evidence integrity</li>
          <li>SHA-256 hashing is a court-recognized standard for digital evidence</li>
          <li>Complete chain of custody documentation meets legal requirements</li>
          <li>Court-ready reports include all necessary verification data with QR codes</li>
        </ul>
        <p>The system complies with <strong>ISO 27037</strong> (digital evidence handling) and <strong>SWGDE</strong> best practices.</p>
      `,
      related: [
        { label: 'Court Reports', action: 'doc:court-reports' },
        { label: 'Evidence Standards', action: 'doc:evidence-standards' }
      ]
    },
    {
      id: 'legal-export',
      category: 'legal',
      question: 'Can legal reports be exported for court proceedings?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>Yes.</strong> EVID-DGC provides comprehensive report export options:</p>
        <ul>
          <li><strong>PDF Export:</strong> Formatted court reports with blockchain verification QR codes</li>
          <li><strong>JSON Export:</strong> Machine-readable evidence data for integration with case management systems</li>
          <li><strong>Evidence Package:</strong> Complete package with evidence files, hashes, and blockchain proofs</li>
        </ul>
        <p>All exported reports include the evidence SHA-256 hash, IPFS CID, blockchain transaction IDs, and complete chain of custody timeline.</p>
      `,
      related: [
        { label: 'Court Reports Guide', action: 'doc:court-reports' },
        { label: 'Compliance', action: 'doc:compliance' }
      ]
    },
    {
      id: 'legal-records',
      category: 'legal',
      question: 'How are legal hold records maintained?',
      readingTime: '2 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>Legal hold records in EVID-DGC are maintained with the same blockchain integrity as evidence:</p>
        <ul>
          <li>When a legal hold is placed, it is recorded as a blockchain transaction</li>
          <li>The evidence is flagged and cannot be modified or transferred during the hold</li>
          <li>All access attempts are logged with heightened scrutiny</li>
          <li>Only authorized legal or court personnel can place or remove holds</li>
        </ul>
        <p>Legal hold compliance is fully auditable and court-admissible.</p>
      `,
      related: [
        { label: 'Legal Hold', action: 'doc:legal-hold' },
        { label: 'Compliance', action: 'doc:compliance' }
      ]
    },

    // --- API ---
    {
      id: 'api-available',
      category: 'api',
      question: 'Does EVID-DGC have an API for developers?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>Yes.</strong> EVID-DGC provides a comprehensive REST API for developers to integrate with existing systems.</p>
        <p>Key API capabilities:</p>
        <ul>
          <li>Evidence upload and retrieval</li>
          <li>Case management (create, update, list)</li>
          <li>Blockchain verification queries</li>
          <li>Chain of custody retrieval</li>
          <li>User management (admin only)</li>
          <li>Audit log queries</li>
        </ul>
        <p>The API uses JWT authentication and supports both JSON and multipart form data.</p>
      `,
      related: [
        { label: 'API Reference', action: 'doc:auth' },
        { label: 'API Endpoints', action: 'doc:endpoints' }
      ]
    },
    {
      id: 'api-auth',
      category: 'api',
      question: 'How do developers authenticate with the API?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Authentication is handled via <strong>JWT (JSON Web Tokens)</strong>:</p>
        <div class="qa-code-block"><pre><code>// Obtain a token
POST /api/auth/login
Content-Type: application/json
{ "email": "user@example.com", "password": "your-password" }

// Use the token
GET /api/evidence
Authorization: Bearer &lt;your-jwt-token&gt;</code></pre></div>
        <p>Tokens expire after a configurable period. For programmatic access, you can also use MetaMask wallet signatures for authentication.</p>
      `,
      related: [
        { label: 'API Authentication', action: 'doc:auth' },
        { label: 'Code Examples', action: 'doc:examples' }
      ]
    },
    {
      id: 'api-docs',
      category: 'api',
      question: 'Where can I find the complete API documentation?',
      readingTime: '1 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Complete API documentation is available in the <strong>Documentation Center</strong> under API Reference.</p>
        <p>You can also access:</p>
        <ul>
          <li><strong>Swagger UI:</strong> Interactive API documentation with try-it-out functionality</li>
          <li><strong>Postman Collection:</strong> Pre-configured API requests for testing</li>
          <li><strong>Code Examples:</strong> JavaScript, Python, and cURL examples</li>
        </ul>
      `,
      related: [
        { label: 'API Reference', action: 'doc:auth' },
        { label: 'Code Examples', action: 'doc:examples' }
      ]
    },

    // --- Troubleshooting ---
    {
      id: 'metamask-connection',
      category: 'troubleshooting',
      question: 'MetaMask is not connecting. What should I do?',
      popular: true,
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>If MetaMask is not connecting, try these solutions in order:</p>
        <ol>
          <li><strong>Check Installation:</strong> Ensure MetaMask is installed and unlocked in your browser</li>
          <li><strong>Refresh the Page:</strong> Sometimes a simple refresh resolves connection issues</li>
          <li><strong>Check Network:</strong> Ensure you are on Polygon Amoy testnet (Chain ID: 0x13882)</li>
          <li><strong>Clear Cache:</strong> Clear your browser cache and restart</li>
          <li><strong>Reinstall MetaMask:</strong> As a last resort, reinstall the MetaMask extension</li>
        </ol>
        <div class="qa-callout qa-callout-warning"><i data-lucide="alert-triangle"></i><div>Make sure popups are not blocked by your browser. MetaMask requires popup access.</div></div>
      `,
      related: [
        { label: 'Common Issues', action: 'doc:common-issues' },
        { label: 'Wallet Setup', action: 'doc:setup' }
      ]
    },
    {
      id: 'upload-failed',
      category: 'troubleshooting',
      question: 'Evidence upload keeps failing. What could be wrong?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Upload failures usually have one of these causes:</p>
        <ul>
          <li><strong>File Too Large:</strong> Maximum file size is 50MB. Check your file size.</li>
          <li><strong>Unsupported Format:</strong> Check the supported file formats list above.</li>
          <li><strong>Network Issues:</strong> IPFS upload requires a stable internet connection. Try again on a wired connection.</li>
          <li><strong>Session Expired:</strong> Your authentication session may have expired. Try logging out and back in.</li>
          <li><strong>Blockchain RPC Issues:</strong> The Polygon network may be experiencing congestion. Wait a few minutes and try again.</li>
        </ul>
      `,
      related: [
        { label: 'Troubleshooting', action: 'doc:common-issues' },
        { label: 'Evidence Upload', action: 'doc:evidence-upload' }
      ]
    },
    {
      id: 'login-issues',
      category: 'troubleshooting',
      question: 'I cant log in. What should I check?',
      popular: true,
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>If you are having trouble logging in, check these common issues:</p>
        <h4>MetaMask Login</h4>
        <ul>
          <li>Ensure MetaMask is unlocked</li>
          <li>Check you are on the correct network (Polygon Amoy)</li>
          <li>Approve the connection request in MetaMask</li>
          <li>Make sure popups are not blocked</li>
        </ul>
        <h4>Email Login</h4>
        <ul>
          <li>Verify your email and password are correct</li>
          <li>Use the "Forgot Password" link to reset your password</li>
          <li>Check that your account has been verified (check your email for a verification link)</li>
        </ul>
      `,
      related: [
        { label: 'Common Issues', action: 'doc:common-issues' },
        { label: 'Setup Guide', action: 'doc:setup' }
      ]
    },
    {
      id: 'permission-denied',
      category: 'troubleshooting',
      question: 'Why am I seeing "Permission Denied" errors?',
      readingTime: '1 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>"Permission Denied" errors mean your role does not have the required access level for the action you are trying to perform.</p>
        <p>Common causes:</p>
        <ul>
          <li>You are trying to upload evidence but your role is "Public Viewer"</li>
          <li>You are trying to access a case you are not assigned to</li>
          <li>Your session has expired and you need to log in again</li>
          <li>The evidence is under legal hold and cannot be accessed</li>
        </ul>
        <p>Contact your system administrator if you believe you should have access.</p>
      `,
      related: [
        { label: 'User Roles', action: 'doc:all-roles' },
        { label: 'Permissions Matrix', action: 'doc:permissions' }
      ]
    },
    {
      id: 'verification-failed',
      category: 'troubleshooting',
      question: 'Why did blockchain verification fail?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Blockchain verification can fail for several reasons:</p>
        <ul>
          <li><strong>Evidence Modified:</strong> The file has been altered since upload. The computed SHA-256 hash does not match the blockchain record.</li>
          <li><strong>Wrong File:</strong> You are trying to verify a different file than what was originally uploaded.</li>
          <li><strong>Network Issues:</strong> Cannot connect to the Polygon network. Check your internet connection.</li>
          <li><strong>RPC Node Down:</strong> The blockchain RPC node may be temporarily unavailable. Try again later.</li>
        </ul>
        <p>If the verification consistently fails with multiple files, there may be a system issue — contact support.</p>
      `,
      related: [
        { label: 'Verification Process', action: 'doc:verification' },
        { label: 'Troubleshooting', action: 'doc:common-issues' }
      ]
    },

    // --- Account ---
    {
      id: 'create-account',
      category: 'account',
      question: 'How do I create a new account?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>Creating an account is simple:</p>
        <ol>
          <li>On the homepage, scroll to the <strong>Login Options</strong> section</li>
          <li>Choose either "MetaMask Wallet" or "Email & Password"</li>
          <li>Follow the registration flow and select your role</li>
          <li>Once registered, you will be redirected to your dashboard</li>
        </ol>
        <p>For MetaMask registration, you will need the MetaMask browser extension installed.</p>
      `,
      related: [
        { label: 'Setup Guide', action: 'doc:setup' },
        { label: 'User Roles', action: 'doc:all-roles' }
      ]
    },
    {
      id: 'change-role',
      category: 'account',
      question: 'Can I change my role after registration?',
      readingTime: '1 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>Role changes must be approved by a system administrator.</p>
        <p>To request a role change:</p>
        <ol>
          <li>Contact your system administrator with your request</li>
          <li>The administrator will review and approve the change</li>
          <li>You will receive a notification when your role has been updated</li>
        </ol>
        <p>Some roles require additional verification (e.g., Court officials may need credential verification).</p>
      `,
      related: [
        { label: 'User Roles', action: 'doc:all-roles' },
        { label: 'Permissions', action: 'doc:permissions' }
      ]
    },
    {
      id: 'reset-password',
      category: 'account',
      question: 'How do I reset my password?',
      readingTime: '1 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>To reset your email password:</p>
        <ol>
          <li>On the login modal, click <strong>"Forgot Password"</strong></li>
          <li>Enter your registered email address</li>
          <li>Check your email for a password reset link</li>
          <li>Click the link and enter your new password</li>
        </ol>
        <p>If you do not receive the reset email, check your spam folder or contact support.</p>
      `,
      related: [
        { label: 'Setup Guide', action: 'doc:setup' }
      ]
    },
    {
      id: 'delete-account',
      category: 'account',
      question: 'Can I delete my account?',
      readingTime: '1 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>Account deletion requests must be submitted to your system administrator.</p>
        <p>Please note:</p>
        <ul>
          <li>Evidence records created by your account remain on the blockchain (they are immutable)</li>
          <li>Your personal data will be removed from the system database</li>
          <li>Blockchain transactions cannot be deleted — they remain as a permanent record</li>
        </ul>
        <p>Contact support or your administrator to initiate the account deletion process.</p>
      `,
      related: [
        { label: 'Compliance', action: 'doc:compliance' }
      ]
    },

    // --- General ---
    {
      id: 'system-requirements',
      category: 'general',
      question: 'What are the system requirements for using EVID-DGC?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC is a web-based application accessible from any modern browser:</p>
        <ul>
          <li><strong>Browsers:</strong> Chrome, Firefox, Edge, Brave (latest versions)</li>
          <li><strong>MetaMask:</strong> Required for blockchain authentication (browser extension)</li>
          <li><strong>Screen:</strong> Minimum 1024px width (desktop view required)</li>
          <li><strong>Internet:</strong> Stable connection for evidence upload and blockchain transactions</li>
        </ul>
        <p><strong>Note:</strong> EVID-DGC requires a desktop or laptop screen. Mobile browsers are not currently supported for the full experience.</p>
      `,
      related: [
        { label: 'Setup Guide', action: 'doc:setup' },
        { label: 'Installation', action: 'doc:installation' }
      ]
    },
    {
      id: 'browsers-supported',
      category: 'general',
      question: 'Which browsers are supported?',
      readingTime: '1 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC supports the following browsers (with MetaMask extension):</p>
        <ul>
          <li><strong>Google Chrome</strong> — Fully supported</li>
          <li><strong>Mozilla Firefox</strong> — Fully supported</li>
          <li><strong>Microsoft Edge</strong> — Fully supported</li>
          <li><strong>Brave</strong> — Fully supported (MetaMask built-in)</li>
        </ul>
        <p>Safari has partial support. Mobile browsers are not currently supported.</p>
      `,
      related: [
        { label: 'Setup Guide', action: 'doc:setup' }
      ]
    },
    {
      id: 'data-retention',
      category: 'general',
      question: 'How long is evidence stored in the system?',
      readingTime: '2 min',
      lastUpdated: 'Feb 2026',
      answer: `
        <p>Evidence in EVID-DGC is stored <strong>permanently</strong> on the blockchain and IPFS network.</p>
        <p>Key points:</p>
        <ul>
          <li>Blockchain hash records are permanent and cannot be deleted</li>
          <li>IPFS files remain available as long as they are pinned to the network</li>
          <li>The system supports configurable retention policies based on case type and jurisdictional requirements</li>
          <li>Archived evidence remains verifiable but may be moved to cold storage for long-term preservation</li>
        </ul>
        <p>Retention policies can be configured by administrators to comply with local regulations.</p>
      `,
      related: [
        { label: 'Legal Hold', action: 'doc:legal-hold' },
        { label: 'Compliance', action: 'doc:compliance' }
      ]
    },
    {
      id: 'collaboration',
      category: 'general',
      question: 'Can multiple users work on the same case simultaneously?',
      readingTime: '2 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p><strong>Yes.</strong> EVID-DGC supports collaborative case management with real-time updates:</p>
        <ul>
          <li>Multiple authorized users can work on the same case simultaneously</li>
          <li>Role-based permissions ensure appropriate access levels</li>
          <li>Real-time updates via WebSocket notifications keep all team members informed</li>
          <li>Automatic conflict resolution prevents data inconsistencies</li>
          <li><strong>Audit trail</strong> records every action by every user</li>
        </ul>
        <p>This makes EVID-DGC ideal for multi-agency investigations where different teams need to collaborate on the same evidence.</p>
      `,
      related: [
        { label: 'Evidence Workflow', action: 'doc:case-creation' },
        { label: 'User Roles', action: 'doc:all-roles' }
      ]
    },
    {
      id: 'blockchain-vs-traditional',
      category: 'general',
      question: 'How is EVID-DGC different from traditional evidence management systems?',
      popular: true,
      readingTime: '3 min',
      lastUpdated: 'Mar 2026',
      answer: `
        <p>EVID-DGC addresses critical limitations of traditional evidence management systems:</p>
        <div class="qa-table-wrap"><table class="qa-table"><thead><tr><th>Feature</th><th>Traditional Systems</th><th>EVID-DGC</th></tr></thead><tbody>
        <tr><td>Integrity</td><td>Database-level (can be altered)</td><td>Cryptographic (immutable)</td></tr>
        <tr><td>Verification</td><td>Requires system access</td><td>Publicly verifiable</td></tr>
        <tr><td>Chain of Custody</td><td>Paper-based or database logs</td><td>Blockchain-recorded</td></tr>
        <tr><td>Trust Model</td><td>Central authority</td><td>Decentralized</td></tr>
        <tr><td>Auditability</td><td>Limited to internal logs</td><td>Full public audit trail</td></tr>
        <tr><td>Court Readiness</td><td>Requires expert testimony</td><td>Self-verifying blockchain proof</td></tr>
        </tbody></table></div>
      `,
      related: [
        { label: 'Overview', action: 'doc:overview' },
        { label: 'System Architecture', action: 'doc:frontend' }
      ]
    }
  ],
};

class QAManager {
  constructor() {
    this.state = {
      activeCategory: 'getting-started',
      searchQuery: '',
      openQuestion: null,
      helpfulVotes: JSON.parse(localStorage.getItem('evid-qa-helpful') || '{}'),
      bookmarks: JSON.parse(localStorage.getItem('evid-qa-bookmarks') || '[]'),
      recentSearches: JSON.parse(localStorage.getItem('evid-qa-recent-searches') || '[]')
    };
    this.container = null;
    this.filteredQuestions = [...QA_DATA.questions];
    this.askInputFocused = false;
  }

  init() {
    const section = document.getElementById('faq');
    if (!section) { console.warn('Q&A section not found'); return; }
    this.container = section;
    this.render();
    this.attachEvents();
  }

  render() {
    const askHtml = this.renderAskAssistant();
    const statsHtml = this.renderStats();
    const searchHtml = this.renderSearch();
    const categoriesHtml = this.renderCategories();
    const popularHtml = this.renderPopularQuestions();
    const questionsHtml = this.renderQuestions();
    this.container.innerHTML = `
      <div class="qa-workspace">
        <!-- Hero -->
        <div class="qa-hero">
          <div class="qa-hero-left">
            <div class="qa-badge">Help Center</div>
            <h2>Q&A <span>Knowledge Center</span></h2>
            <p>Find instant answers about digital evidence management, blockchain verification, user roles, APIs, security, legal workflows, and forensic investigations.</p>
          </div>
          <div class="qa-hero-right">
            <div class="qa-hero-visual">
              <div class="qhv-item qhv-folder"><i data-lucide="folder"></i><span>Evidence</span></div>
              <div class="qhv-connector"><i data-lucide="chevron-right"></i></div>
              <div class="qhv-item qhv-cube"><i data-lucide="box"></i><span>Blockchain</span></div>
              <div class="qhv-connector"><i data-lucide="chevron-right"></i></div>
              <div class="qhv-item qhv-shield"><i data-lucide="shield"></i><span>Security</span></div>
              <div class="qhv-connector"><i data-lucide="chevron-right"></i></div>
              <div class="qhv-item qhv-help"><i data-lucide="help-circle"></i><span>Answers</span></div>
            </div>
          </div>
        </div>

        <!-- Ask Assistant -->
        ${askHtml}

        <!-- Stats -->
        ${statsHtml}

        <!-- Search -->
        ${searchHtml}

        <!-- Categories -->
        ${categoriesHtml}

        <!-- Popular Questions -->
        ${popularHtml}

        <!-- Main Q&A List -->
        <div class="qa-main-list" id="qaMainList">${questionsHtml}</div>

        <!-- (Common Tasks, Related Docs, Video, Support removed) -->
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  renderAskAssistant() {
    return `
      <div class="qa-assistant">
        <div class="qa-assistant-icon"><i data-lucide="bot"></i></div>
        <div class="qa-assistant-content">
          <div class="qa-assistant-header">
            <h4>Ask EVID Assistant</h4>
            <span class="qa-assistant-badge">Beta</span>
          </div>
          <p>Ask anything about evidence management, blockchain verification, user roles, or forensic workflows.</p>
          <div class="qa-assistant-input-wrap">
            <i data-lucide="message-circle"></i>
            <input type="text" class="qa-assistant-input" placeholder="Ask a question..." aria-label="Ask EVID Assistant">
            <button class="qa-assistant-btn" aria-label="Ask"><i data-lucide="arrow-right"></i></button>
          </div>
          <div class="qa-assistant-suggestions">
            <span>Try:</span>
            <button class="qa-assist-sug" data-query="How do I upload evidence?">Upload evidence</button>
            <button class="qa-assist-sug" data-query="What is blockchain verification?">Blockchain verification</button>
            <button class="qa-assist-sug" data-query="What roles exist?">User roles</button>
          </div>
        </div>
      </div>
    `;
  }

  renderStats() {
    const s = QA_DATA.stats;
    return `
      <div class="qa-stats-row">
        <div class="qa-stat-card"><div class="qsc-icon"><i data-lucide="help-circle"></i></div><div class="qsc-info"><span class="qsc-value">${s.questions}</span><span class="qsc-label">Questions</span></div></div>
        <div class="qa-stat-card"><div class="qsc-icon"><i data-lucide="book-open"></i></div><div class="qsc-info"><span class="qsc-value">${s.guides}</span><span class="qsc-label">Guides</span></div></div>
        <div class="qa-stat-card"><div class="qsc-icon"><i data-lucide="users"></i></div><div class="qsc-info"><span class="qsc-value">${s.roles}</span><span class="qsc-label">User Roles</span></div></div>
        <div class="qa-stat-card"><div class="qsc-icon"><i data-lucide="shield"></i></div><div class="qsc-info"><span class="qsc-value">${s.security}</span><span class="qsc-label">Security Features</span></div></div>
        <div class="qa-stat-card"><div class="qsc-icon"><i data-lucide="code"></i></div><div class="qsc-info"><span class="qsc-value">${s.endpoints}</span><span class="qsc-label">API Endpoints</span></div></div>
        <div class="qa-stat-card"><div class="qsc-icon"><i data-lucide="clock"></i></div><div class="qsc-info"><span class="qsc-value">${s.lastUpdated}</span><span class="qsc-label">Last Updated</span></div></div>
      </div>
    `;
  }

  renderSearch() {
    return `
      <div class="qa-search-bar">
        <div class="qa-search-field">
          <i data-lucide="search"></i>
          <input type="text" class="qa-search-input" placeholder="Search questions..." aria-label="Search questions">
          <span class="qa-search-kbd"><i data-lucide="command"></i>K</span>
          <div class="qa-search-suggestions"></div>
        </div>
      </div>
    `;
  }

  renderCategories() {
    return `
      <div class="qa-categories">
        ${QA_DATA.categories.map(c => `
          <button class="qa-chip ${c.id === this.state.activeCategory ? 'active' : ''}" data-category="${c.id}">
            <i data-lucide="${c.icon}"></i>
            <span>${c.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  renderPopularQuestions() {
    const popular = QA_DATA.questions.filter(q => q.popular).slice(0, 8);
    return `
      <div class="qa-popular">
        <div class="qa-section-header">
          <i data-lucide="trending-up"></i>
          <h3>Popular Questions</h3>
        </div>
        <div class="qa-popular-grid">
          ${popular.map(q => `
            <button class="qa-popular-card" data-id="${q.id}">
              <div class="qpc-icon"><i data-lucide="message-circle"></i></div>
              <span>${q.question}</span>
              <div class="qpc-meta"><i data-lucide="clock"></i> ${q.readingTime}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderQuestions(questions) {
    const items = questions || this.filteredQuestions;
    if (items.length === 0) {
      return `<div class="qa-empty"><i data-lucide="search-x"></i><h3>No questions found</h3><p>Try adjusting your search or selecting a different category.</p></div>`;
    }
    return `<div class="qa-list">${items.map(q => this.renderQuestionCard(q)).join('')}</div>`;
  }

  renderQuestionCard(q) {
    const isOpen = this.state.openQuestion === q.id;
    const isBookmarked = this.state.bookmarks.includes(q.id);
    const helpful = this.state.helpfulVotes[q.id];
    return `
      <div class="qa-item ${isOpen ? 'open' : ''}" data-id="${q.id}">
        <div class="qa-question">
          <div class="qq-left">
            <div class="qq-icon"><i data-lucide="help-circle"></i></div>
            <div class="qq-info">
              <h3>${q.question}</h3>
              <div class="qq-meta">
                <span class="qq-category">${QA_DATA.categories.find(c => c.id === q.category)?.label || q.category}</span>
                <span><i data-lucide="clock"></i> ${q.readingTime}</span>
                <span><i data-lucide="calendar"></i> ${q.lastUpdated}</span>
              </div>
            </div>
          </div>
          <div class="qq-right">
            <button class="qq-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-id="${q.id}" title="Bookmark"><i data-lucide="bookmark"></i></button>
            <div class="qq-chevron"><i data-lucide="chevron-down"></i></div>
          </div>
        </div>
        <div class="qa-answer">
          <div class="qa-answer-inner">
            ${q.answer}
            ${q.related && q.related.length > 0 ? `
              <div class="qa-related-links">
                <strong>Related Documentation:</strong>
                ${q.related.map(r => `<button class="qa-rel-link" data-action="${r.action}"><i data-lucide="book-open"></i>${r.label}</button>`).join('')}
              </div>
            ` : ''}
            <div class="qa-answer-footer">
              <div class="qa-helpful">
                <span>Was this helpful?</span>
                <button class="qa-helpful-btn ${helpful === 'yes' ? 'voted' : ''}" data-id="${q.id}" data-vote="yes"><i data-lucide="thumbs-up"></i> Yes</button>
                <button class="qa-helpful-btn ${helpful === 'no' ? 'voted' : ''}" data-id="${q.id}" data-vote="no"><i data-lucide="thumbs-down"></i> No</button>
              </div>
              <div class="qa-actions">
                <button class="qa-action-btn" onclick="navigator.clipboard.writeText(window.location.href.split('#')[0]+'#faq')" title="Copy link"><i data-lucide="link"></i></button>
                <button class="qa-action-btn" onclick="window.print()" title="Print"><i data-lucide="printer"></i></button>
                <button class="qa-action-btn" onclick="navigator.clipboard.writeText('${q.question.replace(/'/g, "\\'")}')" title="Share"><i data-lucide="share-2"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    document.addEventListener('click', (e) => {
      // Category chips
      const chip = e.target.closest('.qa-chip');
      if (chip) {
        const cat = chip.dataset.category;
        this.state.activeCategory = cat;
        this.container.querySelectorAll('.qa-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filterQuestions();
        return;
      }

      // Question toggle
      const questionEl = e.target.closest('.qa-question');
      if (questionEl) {
        const item = questionEl.closest('.qa-item');
        if (item) {
          const id = item.dataset.id;
          this.state.openQuestion = this.state.openQuestion === id ? null : id;
          const content = item.querySelector('.qa-answer');
          if (content) {
            content.style.maxHeight = this.state.openQuestion === id ? content.scrollHeight + 'px' : null;
            item.classList.toggle('open', this.state.openQuestion === id);
          }
          return;
        }
      }

      // Popular question card
      const popCard = e.target.closest('.qa-popular-card');
      if (popCard) {
        const id = popCard.dataset.id;
        this.state.openQuestion = id;
        this.filterQuestions();
        setTimeout(() => {
          const el = this.container.querySelector(`.qa-item[data-id="${id}"]`);
          if (el) {
            const content = el.querySelector('.qa-answer');
            if (content) { content.style.maxHeight = content.scrollHeight + 'px'; el.classList.add('open'); }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }

      // Bookmark
      const bookmark = e.target.closest('.qq-bookmark');
      if (bookmark) {
        const id = bookmark.dataset.id;
        if (this.state.bookmarks.includes(id)) {
          this.state.bookmarks = this.state.bookmarks.filter(b => b !== id);
          bookmark.classList.remove('bookmarked');
        } else {
          this.state.bookmarks.push(id);
          bookmark.classList.add('bookmarked');
        }
        localStorage.setItem('evid-qa-bookmarks', JSON.stringify(this.state.bookmarks));
        return;
      }

      // Helpful vote
      const helpful = e.target.closest('.qa-helpful-btn');
      if (helpful) {
        const id = helpful.dataset.id;
        const vote = helpful.dataset.vote;
        if (this.state.helpfulVotes[id] === vote) {
          delete this.state.helpfulVotes[id];
          helpful.classList.remove('voted');
        } else {
          this.state.helpfulVotes[id] = vote;
          helpful.closest('.qa-helpful')?.querySelectorAll('.qa-helpful-btn').forEach(b => b.classList.remove('voted'));
          helpful.classList.add('voted');
        }
        localStorage.setItem('evid-qa-helpful', JSON.stringify(this.state.helpfulVotes));
        return;
      }

      // Doc action links
      const relLink = e.target.closest('.qa-rel-link');
      if (relLink) {
        this.handleDocAction(relLink.dataset.action);
        return;
      }

      // Task cards
      const taskCard = e.target.closest('.qa-task-card');
      if (taskCard) {
        this.handleDocAction(taskCard.dataset.action);
        return;
      }

      // Related doc cards
      const relCard = e.target.closest('.qa-related-card');
      if (relCard) {
        this.handleDocAction(relCard.dataset.action);
        return;
      }

      // Video cards
      const vidCard = e.target.closest('.qa-video-card');
      if (vidCard) {
        this.handleDocAction(vidCard.dataset.action);
        return;
      }

      // Search suggestion click
      const suggItem = e.target.closest('.qss-item');
      if (suggItem) {
        const q = suggItem.dataset.query;
        const searchInput = this.container.querySelector('.qa-search-input');
        if (searchInput) { searchInput.value = q; }
        this.state.searchQuery = q;
        this.hideSearchSuggestions();
        this.filterQuestions();
        return;
      }

      // Assistant suggestion
      const assistSug = e.target.closest('.qa-assist-sug');
      if (assistSug) {
        const query = assistSug.dataset.query;
        const input = this.container.querySelector('.qa-assistant-input');
        if (input) input.value = query;
        this.performAssistantSearch(query);
        return;
      }

      // Assistant button
      const assistBtn = e.target.closest('.qa-assistant-btn');
      if (assistBtn) {
        const input = this.container.querySelector('.qa-assistant-input');
        if (input && input.value.trim()) {
          this.performAssistantSearch(input.value.trim());
        }
        return;
      }

      if (!e.target.closest('.qa-search-field')) {
        this.hideSearchSuggestions();
      }
    });

    // Search
    const searchInput = this.container.querySelector('.qa-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.filterQuestions();
        if (e.target.value.length >= 2) this.showSearchSuggestions(e.target.value);
        else this.hideSearchSuggestions();
      });
      searchInput.addEventListener('focus', (e) => {
        if (e.target.value.length >= 2) this.showSearchSuggestions(e.target.value);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { searchInput.blur(); this.hideSearchSuggestions(); }
        if (e.key === 'Enter') {
          const first = this.container.querySelector('.qss-item');
          if (first) first.click();
        }
      });
    }

    // Assistant input
    const assistInput = this.container.querySelector('.qa-assistant-input');
    if (assistInput) {
      assistInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && assistInput.value.trim()) {
          this.performAssistantSearch(assistInput.value.trim());
        }
      });
    }

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });
  }

  performAssistantSearch(query) {
    const q = query.toLowerCase();
    const results = QA_DATA.questions.filter(item =>
      item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
    if (results.length > 0) {
      const best = results[0];
      this.state.openQuestion = best.id;
      this.filterQuestions();
      setTimeout(() => {
        const el = this.container.querySelector(`.qa-item[data-id="${best.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const content = el.querySelector('.qa-answer');
          if (content) { content.style.maxHeight = content.scrollHeight + 'px'; el.classList.add('open'); }
        }
      }, 150);
    }
  }

  showSearchSuggestions(query) {
    const q = query.toLowerCase();
    const results = QA_DATA.questions.filter(item =>
      item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    ).slice(0, 6);
    const el = this.container.querySelector('.qa-search-suggestions');
    if (!el) return;
    if (results.length === 0) {
      el.innerHTML = `<div class="qss-empty"><i data-lucide="search-x"></i><span>No results found</span></div>`;
      el.classList.add('visible');
      return;
    }
    el.innerHTML = `<div class="qss-header">${results.length} question${results.length > 1 ? 's' : ''} found</div>
      ${results.map(r => `<button class="qss-item" data-query="${r.question}"><i data-lucide="message-circle"></i><div><span>${this.highlightMatch(r.question, q)}</span><small>${QA_DATA.categories.find(c => c.id === r.category)?.label || r.category}</small></div></button>`).join('')}`;
    el.classList.add('visible');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  hideSearchSuggestions() {
    const el = this.container.querySelector('.qa-search-suggestions');
    if (el) el.classList.remove('visible');
  }

  highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  filterQuestions() {
    const cat = this.state.activeCategory;
    const q = this.state.searchQuery.toLowerCase().trim();
    let results = QA_DATA.questions;
    if (cat !== 'all') results = results.filter(item => item.category === cat);
    if (q.length >= 2) {
      results = results.filter(item =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      );
    }
    this.filteredQuestions = results;
    const list = this.container.querySelector('#qaMainList');
    if (list) {
      list.innerHTML = this.renderQuestions(results);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  handleDocAction(action) {
    if (!action) return;
    if (action.startsWith('doc:')) {
      const docId = action.replace('doc:', '');
      const docSection = document.getElementById('documentation');
      if (docSection && typeof initializeDocumentation === 'function' && window.docManagerInstance) {
        const folder = DOC_DATA.folders.find(f => f.items.some(i => i.id === docId));
        if (folder) {
          scrollToSection('documentation');
          setTimeout(() => {
            if (window.docManagerInstance && typeof window.docManagerInstance.loadContent === 'function') {
              window.docManagerInstance.loadContent(folder.id, docId);
            }
          }, 500);
          return;
        }
      }
      scrollToSection('documentation');
    } else if (action.startsWith('scroll:')) {
      scrollToSection(action.replace('scroll:', ''));
    } else if (action === 'scroll:documentation') {
      scrollToSection('documentation');
    } else if (action === 'scroll:registrationSection') {
      scrollToSection('registrationSection');
    }
  }
}

let qaManagerInstance = null;
function initializeQA() {
  if (qaManagerInstance) return;
  if (!document.getElementById('faq')) { setTimeout(initializeQA, 200); return; }
  qaManagerInstance = new QAManager();
  qaManagerInstance.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initializeQA, 400));
} else {
  setTimeout(initializeQA, 400);
}
