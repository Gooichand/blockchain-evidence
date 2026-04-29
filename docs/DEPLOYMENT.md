# EVID-DGC Deployment Guide

## Prerequisites

- GitHub repository with code
- Supabase account and project
- Render.com account (recommended)
- Environment variables documented
- Database schema deployed

## Render.com Deployment (Recommended)

### 1. Prepare Repository

```bash
# Ensure render.yaml exists (it does)
# Ensure package.json has correct scripts
# Verify all dependencies in package.json
```

### 2. Supabase Setup

1. Create Supabase project
2. Run SQL from `complete-database-setup-fixed.sql`
3. Note your project URL and anon key
4. Enable Row Level Security
5. Test database connection

### 3. Render Configuration

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure service:
   ```
   Name: evid-dgc
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Node Version: 16.x
   ```

### 4. Environment Variables

Set in Render dashboard:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
NODE_ENV=production
PORT=3000

# Optional
ALLOWED_ORIGINS=https://your-app.onrender.com
```

### 5. Deploy

1. Click "Create Web Service"
2. Render auto-deploys from main branch
3. Monitor build logs
4. Verify deployment at provided URL

## Alternative Deployment Options

### Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## Post-Deployment Verification

### Health Checks

1. Visit `/api/health` endpoint
2. Verify response: `{"status":"OK",...}`
3. Check database connectivity
4. Test user registration
5. Test file upload functionality

### Functional Testing

1. **Authentication**:
   - Email login/registration
   - MetaMask wallet connection
   - Role assignment

2. **Core Features**:
   - Evidence upload
   - Case creation
   - User management (admin)
   - File download with watermark

3. **Security**:
   - Rate limiting working
   - CORS headers present
   - RLS policies active
   - Audit logging functional

## Environment Configuration

### Development

```env
NODE_ENV=development
DEBUG=*
SUPABASE_URL=http://localhost:54321
```

### Production

```env
NODE_ENV=production
DEBUG=app:*
SUPABASE_URL=https://production.supabase.co
```

## Monitoring Setup

### Application Monitoring

- Health endpoint: `/api/health`
- Uptime monitoring via Render
- Error tracking in logs
- Performance metrics

### Database Monitoring

- Supabase dashboard metrics
- Query performance monitoring
- Connection pool status
- Storage usage tracking

## Backup Strategy

### Database Backups

- Supabase automatic backups enabled
- Point-in-time recovery available
- Manual backup before major changes
- Test restore procedures monthly

### Code Backups

- GitHub repository (primary)
- Local development copies
- Tagged releases for versions

## Scaling Considerations

### Horizontal Scaling

- Render auto-scaling available
- Database connection pooling
- Stateless application design
- Load balancer ready

### Performance Optimization

- Database query optimization
- File upload size limits
- Rate limiting configuration
- CDN for static assets (future)

## SSL/HTTPS Configuration

### Render.com

- Automatic SSL certificate
- HTTPS redirect enabled
- HTTP/2 support
- Certificate auto-renewal

### Custom Domain (Optional)

1. Add custom domain in Render
2. Update DNS CNAME record
3. SSL certificate auto-generated
4. Update CORS origins

## Troubleshooting Deployment

### Common Issues

**Build Failures**:

```bash
# Check package.json dependencies
# Verify Node.js version compatibility
# Review build logs in Render dashboard
```

**Database Connection Issues**:

```bash
# Verify SUPABASE_URL format
# Check SUPABASE_KEY validity
# Test connection from local environment
# Review Supabase project settings
```

**Environment Variable Issues**:

```bash
# Verify all required variables set
# Check for typos in variable names
# Ensure no trailing spaces
# Test locally with same variables
```

**File Upload Issues**:

```bash
# Check file size limits (100MB)
# Verify supported file types
# Test with small files first
# Review server logs for errors
```

### Debug Commands

```bash
# Check environment variables
curl https://your-app.onrender.com/api/health

# Test database connection
# (Add debug endpoint if needed)

# Check logs
# View in Render dashboard
```

## Rollback Procedures

### Quick Rollback

1. Identify last working commit
2. Revert to that commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
3. Render auto-deploys reverted version
4. Verify functionality restored

### Database Rollback

1. Stop application
2. Restore database from backup
3. Restart application
4. Verify data integrity
5. Test all functionality

## Security Hardening

### Production Security

- HTTPS enforced
- Security headers configured
- Rate limiting active
- Input validation enabled
- Audit logging operational

### Access Control

- Admin accounts secured
- Database access restricted
- API endpoints protected
- File upload validation active

## Maintenance Schedule

### Daily

- Monitor application health
- Check error logs
- Verify backup completion

### Weekly

- Review security logs
- Check performance metrics
- Update dependencies (if needed)

### Monthly

- Security audit
- Database optimization
- Backup restore test
- Performance review

### Quarterly

- Full security assessment
- Disaster recovery drill
- Scaling evaluation
- Documentation update

## Support and Monitoring

### Monitoring Tools

- Render dashboard for application metrics
- Supabase dashboard for database metrics
- GitHub for code repository status

### Alert Configuration

- Application down alerts
- High error rate alerts
- Database connection alerts
- Storage usage alerts

### Support Contacts

- Technical Issues: DGC2MHNE@proton.me
- GitHub Issues: Repository issue tracker
- Documentation: Available in `/docs` folder
