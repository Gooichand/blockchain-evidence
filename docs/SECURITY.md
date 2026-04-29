# EVID-DGC Security Guide

## Security Overview

EVID-DGC implements multiple security layers:

- Database Row Level Security (RLS)
- Password hashing with salt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Audit logging for all actions

## Authentication Security

### Password Requirements

- Minimum 6 characters (configurable)
- Stored using bcrypt (via bcryptjs) with salt and configurable work factor
- No plaintext password storage
- Password verification via bcrypt-based comparison

### MetaMask Integration

- Wallet address validation (0x + 40 hex chars)
- No private key access or storage
- Client-side signature verification
- Network validation (Polygon)

### Session Management

- User sessions tracked in database
- Session timeout configurable
- Activity logging for all logins
- Failed login attempt tracking

## API Security

### Rate Limiting

```javascript
// Authentication endpoints: 5 requests/15 minutes
// General API: 100 requests/15 minutes
// Admin endpoints: 50 requests/15 minutes
// Export endpoints: 100 requests/hour
```

### Input Validation

- Wallet address format validation
- Email format validation
- File type and size validation
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

### CORS Configuration

```javascript
// Development: localhost:3000, 127.0.0.1:3000
// Production: blockchain-evidence.onrender.com
// Credentials: true for authenticated requests
```

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- Users can view active users only
- Evidence access based on role permissions
- Admin actions logged and restricted
- Service role has full access for API operations

### Data Encryption

- Passwords hashed with bcrypt (via bcryptjs) with salt and configurable work factor
- Sensitive data encrypted at rest (Supabase)
- HTTPS for all data in transit
- Database connections encrypted

### Audit Logging

All actions logged in `activity_logs` table:

- User authentication events
- Evidence upload/download
- Admin actions
- Role changes
- System access attempts

## File Security

### Upload Validation

```javascript
// Allowed file types
('application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/avi',
  'video/mov',
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'application/msword',
  'text/plain',
  'application/zip');

// Size limits: 100MB per file
// Virus scanning: Not implemented (add if needed)
```

### File Integrity

- SHA-256 hash generation for all files
- Hash verification on download
- Watermarking for downloaded files
- Chain of custody tracking

### Storage Security

- Files processed through Multer middleware
- Temporary storage during processing
- Metadata stored in database
- Access controlled by user roles

## Role-Based Access Control

### Role Hierarchy

1. **public_viewer**: Read-only access to public data
2. **investigator**: Create cases, upload evidence
3. **forensic_analyst**: Analyze evidence, generate reports
4. **legal_professional**: Legal review access
5. **court_official**: Court proceeding management
6. **evidence_manager**: Evidence lifecycle management
7. **auditor**: System audit and compliance access
8. **admin**: Full system access

### Permission Matrix

```
Action                  | Public | Investigator | Analyst | Legal | Court | Manager | Auditor | Admin
View Cases             |   ✓    |      ✓       |    ✓    |   ✓   |   ✓   |    ✓    |    ✓    |   ✓
Create Cases           |   ✗    |      ✓       |    ✗    |   ✓   |   ✓   |    ✗    |    ✗    |   ✓
Upload Evidence        |   ✗    |      ✓       |    ✓    |   ✗   |   ✗   |    ✓    |    ✗    |   ✓
Download Evidence      |   ✗    |      ✓       |    ✓    |   ✓   |   ✓   |    ✓    |    ✓    |   ✓
Manage Users           |   ✗    |      ✗       |    ✗    |   ✗   |   ✗   |    ✗    |    ✗    |   ✓
View Audit Logs        |   ✗    |      ✗       |    ✗    |   ✗   |   ✗   |    ✗    |    ✓    |   ✓
```

## Vulnerability Mitigations

### SQL Injection

- All database queries use parameterized statements
- Supabase client handles query sanitization
- No dynamic SQL construction
- Input validation before database operations

### Cross-Site Scripting (XSS)

- Input sanitization on all user inputs
- Output encoding in frontend
- Content Security Policy headers (recommended)
- No innerHTML usage with user data

### Cross-Site Request Forgery (CSRF)

- CORS configuration restricts origins
- State-changing operations require authentication
- No cookies used for authentication
- API-based architecture reduces CSRF risk

### File Upload Attacks

- File type validation by MIME type
- File size limits enforced
- No executable file uploads allowed
- Files processed in isolated environment

## Security Monitoring

### Audit Logging

All security events logged:

```sql
-- Activity logs table tracks:
- User login/logout events
- Failed authentication attempts
- Evidence access and modifications
- Admin actions and user management
- System configuration changes
```

### Error Handling

- Generic error messages to prevent information disclosure
- Detailed errors logged server-side only
- Rate limiting prevents brute force attacks
- Failed attempts tracked and monitored

## Security Checklist

### Before Deployment

- [ ] All environment variables secured
- [ ] Database RLS policies tested
- [ ] Rate limiting configured
- [ ] CORS origins restricted
- [ ] HTTPS enabled
- [ ] Error handling implemented
- [ ] Audit logging enabled
- [ ] File upload validation working
- [ ] Password hashing verified
- [ ] Admin access restricted

### Regular Security Tasks

- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Security scan quarterly
- [ ] Backup verification monthly
- [ ] Access review quarterly
- [ ] Incident response plan updated

## Incident Response

### Security Incident Process

1. **Detection**: Monitor logs and alerts
2. **Assessment**: Determine severity and impact
3. **Containment**: Disable affected accounts/features
4. **Investigation**: Analyze logs and determine cause
5. **Eradication**: Fix vulnerability and clean up
6. **Recovery**: Restore normal operations
7. **Lessons Learned**: Update procedures and training

### Emergency Contacts

- System Administrator: admin@evid-dgc.com
- Technical Support: DGC2MHNE@proton.me
- Security Issues: Report via GitHub issues

## Security Best Practices

### For Developers

- Never commit secrets to version control
- Use environment variables for configuration
- Validate all inputs before processing
- Log security events appropriately
- Follow principle of least privilege
- Keep dependencies updated
- Use HTTPS for all communications

### For Users

- Use strong, unique passwords
- Keep MetaMask extension updated
- Never share private keys or passwords
- Log out when finished
- Report suspicious activity immediately
- Use secure networks for access

### For Administrators

- Regularly review user access
- Monitor audit logs for anomalies
- Keep system updated with security patches
- Backup data regularly and test restores
- Document all security procedures
- Train users on security best practices
