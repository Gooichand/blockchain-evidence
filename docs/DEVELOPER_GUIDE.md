# EVID-DGC Developer Guide

## Quick Setup

```bash
# Clone and setup
git clone <repository-url>
cd blockchain-evidence
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm start
```

## Environment Variables

```env
# Required
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development

# Optional
ALLOWED_ORIGINS=http://localhost:3000
```

## Project Structure

```
├── public/                 # Frontend files
│   ├── index.html         # Main landing page
│   ├── app.js             # Core frontend logic
│   ├── config.js          # Configuration
│   ├── dashboard*.html    # Role-specific dashboards
│   └── styles.css         # Global styles
├── server.js              # Express backend
├── complete-database-setup-fixed.sql  # Database schema
└── package.json           # Dependencies
```

## Available Scripts

```bash
npm start                  # Start development server
npm run dev               # Start with nodemon (if available)
npm run setup             # Run initial setup
npm run health            # Check server health
```

## Database Setup

1. Create Supabase project
2. Copy SQL from `complete-database-setup-fixed.sql`
3. Run in Supabase SQL Editor
4. Update .env with connection details

## API Endpoints (Working)

### Authentication

- `POST /api/auth/email-login` - Email login
- `POST /api/auth/email-register` - Email registration
- `POST /api/auth/wallet-register` - Wallet registration

### Evidence Management

- `POST /api/evidence/upload` - Upload evidence file
- `POST /api/evidence/{id}/download` - Download with watermark
- `POST /api/evidence/bulk-export` - Bulk ZIP export
- `POST /api/evidence/verify-integrity` - Verify file integrity

### User Management

- `GET /api/user/{wallet}` - Get user by wallet
- `PUT /api/user/profile/{id}` - Update profile

### Admin (Admin only)

- `GET /api/admin/users` - List all users
- `POST /api/admin/create-user` - Create new user
- `POST /api/admin/create-admin` - Create admin user
- `POST /api/admin/delete-user` - Deactivate user

### System

- `GET /api/health` - Health check
- `GET /api/notifications/{wallet}` - Get notifications

## Architecture

### Backend (server.js)

- Express.js with Socket.IO
- Multer for file uploads
- Supabase for database
- Rate limiting and CORS
- Role-based access control

### Frontend

- Vanilla JavaScript
- Lucide icons
- MetaMask integration
- Responsive CSS

### Database (Supabase)

- PostgreSQL with Row Level Security
- 17+ tables for users, cases, evidence
- Triggers and functions
- Audit logging

## Development Workflow

1. **Feature Branch**: `git checkout -b feature/name`
2. **Make Changes**: Edit code, add tests
3. **Test Locally**: `npm start` and test
4. **Commit**: `git commit -m "feat: description"`
5. **Push**: `git push origin feature/name`
6. **Create PR**: Submit for review

## Testing

### Manual Testing

1. Start server: `npm start`
2. Open http://localhost:3000
3. Test login flows (email/wallet)
4. Test role-specific features
5. Test admin functions

### Test Accounts

- Admin: `admin@evid-dgc.com` / `admin_password`
- Investigator: `investigator@evid-dgc.com` / `hashed_password_123`

## File Upload System

### Supported Formats

- Images: JPEG, PNG, GIF
- Videos: MP4, AVI, MOV
- Audio: MP3, WAV, M4A
- Documents: PDF, DOC, DOCX, TXT
- Archives: ZIP, RAR

### Size Limits

- Maximum: 100MB per file
- Configurable in server.js

### Processing

- Sharp for image processing
- PDF-lib for PDF watermarking
- Archiver for ZIP creation

## Security Features

### Authentication

- MetaMask wallet verification
- Email/password with hashing
- Session management
- Rate limiting

### Authorization

- Role-based access control
- Row Level Security in database
- Admin-only endpoints protected

### Data Protection

- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## Deployment

### Render.com (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Build: `npm install`
4. Start: `npm start`
5. Auto-deploy on push to main

### Environment Variables for Production

```env
SUPABASE_URL=production_url
SUPABASE_KEY=production_key
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

## Troubleshooting

### Common Issues

- **Config not defined**: Ensure config.js loads before app.js
- **Database connection**: Check Supabase credentials
- **File upload fails**: Check file size and format
- **MetaMask issues**: Ensure extension installed

### Debug Mode

```bash
DEBUG=* npm start  # Enable all debug logs
```

### Logs

- Server logs in console
- Database logs in Supabase dashboard
- Browser console for frontend issues

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Follow commit conventions
5. Submit pull request
6. Code review and merge

## Code Style

- Use semicolons
- 2-space indentation
- camelCase for variables
- Descriptive function names
- Comment complex logic
- Error handling for all async operations
