# Security Policy

## Supported Versions

We actively support the following versions of EVID-DGC with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

### How to Report

Please report security vulnerabilities to **DGC2MHNE@proton.me**.

**DO NOT** create public GitHub issues for security vulnerabilities.

### What to Include

When reporting a security issue, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and severity assessment
- **Reproduction**: Step-by-step instructions to reproduce
- **Environment**: System details (OS, browser, Node.js version)
- **Evidence**: Screenshots, logs, or proof-of-concept code
- **Suggested Fix**: If you have ideas for remediation

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Status Updates**: Weekly until resolution
- **Fix Timeline**: Critical issues within 7 days, others within 30 days

## Security Scope

### In Scope

This security policy applies to:

- **Main Application**: All code in this repository
- **Backend API**: Express.js server and endpoints
- **Database**: Supabase integration and queries
- **Authentication**: MetaMask and email authentication
- **File Upload**: Evidence upload and processing
- **Blockchain Integration**: Smart contract interactions
- **Dependencies**: Third-party packages and libraries

### Out of Scope

- **Third-party Services**: Supabase, Render, GitHub infrastructure
- **Browser Extensions**: MetaMask wallet extension
- **Network Infrastructure**: DNS, CDN, hosting providers
- **Social Engineering**: Phishing, pretexting attacks
- **Physical Security**: Device access, hardware tampering

## Security Measures

### Current Protections

- **Row Level Security (RLS)**: Database access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side data sanitization
- **CORS Protection**: Cross-origin request filtering
- **Secure Headers**: Helmet.js security headers
- **Password Hashing**: bcrypt for password storage
- **JWT Tokens**: Secure session management
- **File Type Validation**: Upload restrictions
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy

### Vulnerability Categories

#### Critical Severity

- Remote Code Execution (RCE)
- SQL Injection leading to data breach
- Authentication bypass
- Privilege escalation to admin
- Mass data exposure

#### High Severity

- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Insecure Direct Object References
- Sensitive data exposure
- Broken access controls

#### Medium Severity

- Information disclosure
- Denial of Service (DoS)
- Weak cryptography
- Insecure configurations
- Missing security headers

#### Low Severity

- Information leakage
- Weak password policies
- Missing rate limiting
- Verbose error messages

## Responsible Disclosure

### Guidelines

1. **Report First**: Contact us before public disclosure
2. **Allow Time**: Give us reasonable time to fix issues
3. **No Harm**: Don't access, modify, or delete data
4. **Stay Legal**: Comply with applicable laws
5. **Be Professional**: Maintain confidentiality

### What We Promise

- **No Legal Action**: Against good-faith security research
- **Credit**: Public acknowledgment (if desired)
- **Communication**: Regular updates on fix progress
- **Collaboration**: Work together on remediation

## Security Best Practices

### For Users

- **Strong Passwords**: Use complex, unique passwords
- **Two-Factor Authentication**: Enable when available
- **Keep Updated**: Use latest browser and MetaMask versions
- **Secure Environment**: Use trusted networks and devices
- **Verify URLs**: Always check you're on the correct domain

### For Developers

- **Code Review**: All changes require peer review
- **Dependency Updates**: Regular security updates
- **Static Analysis**: Automated security scanning
- **Penetration Testing**: Regular security assessments
- **Security Training**: Ongoing education for team

## Incident Response

### Process

1. **Detection**: Vulnerability reported or discovered
2. **Assessment**: Severity and impact evaluation
3. **Containment**: Immediate risk mitigation
4. **Investigation**: Root cause analysis
5. **Remediation**: Develop and test fix
6. **Deployment**: Release security update
7. **Communication**: Notify affected users
8. **Post-Mortem**: Learn and improve processes

### Communication

- **Security Advisories**: Published on GitHub
- **User Notifications**: Email alerts for critical issues
- **Status Page**: Real-time incident updates
- **Release Notes**: Security fixes documented

## Compliance & Standards

### Frameworks

- **OWASP Top 10**: Web application security risks
- **NIST Cybersecurity Framework**: Security controls
- **ISO 27001**: Information security management
- **GDPR**: Data protection and privacy
- **SOC 2**: Security and availability controls

### Certifications

- Regular security audits and assessments
- Compliance with legal evidence handling requirements
- Blockchain security best practices
- Cryptographic standards (AES-256, SHA-256)

## Contact Information

### Security Team

- **Email**: DGC2MHNE@proton.me
- **Response Time**: 48 hours maximum
- **Encryption**: PGP key available upon request
- **Languages**: English

### Emergency Contact

For critical security issues requiring immediate attention:

- **Priority**: Mark email subject with "[CRITICAL SECURITY]"
- **Response**: Within 24 hours
- **Escalation**: Direct contact with development team

## Acknowledgments

We thank the following security researchers who have helped improve EVID-DGC:

_No security issues have been reported yet._

### Hall of Fame

Security researchers who report valid vulnerabilities will be acknowledged here (with permission).

## Legal

### Safe Harbor

We support safe harbor for security researchers who:

- Make good faith efforts to avoid privacy violations
- Don't access or modify user data without permission
- Report vulnerabilities promptly and responsibly
- Don't perform attacks that could harm users

### Scope Limitations

This policy only covers the EVID-DGC application. Issues with third-party services should be reported to their respective security teams.

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Next Review**: July 2026
