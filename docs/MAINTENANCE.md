# EVID-DGC Maintenance Guide

## Regular Maintenance Tasks

### Daily Monitoring

- [ ] Check application health at `/api/health`
- [ ] Review error logs in Render dashboard
- [ ] Verify Supabase database connectivity
- [ ] Monitor disk space usage
- [ ] Check user registration/login functionality

### Weekly Tasks

- [ ] Review security audit logs in `activity_logs` table
- [ ] Check database query performance in Supabase
- [ ] Monitor user activity and system usage
- [ ] Review failed login attempts
- [ ] Verify file upload/download functionality

### Monthly Tasks

- [ ] Update Node.js dependencies (after testing)
- [ ] Analyze system usage metrics
- [ ] Review and optimize slow database queries
- [ ] Security scan of dependencies
- [ ] Database maintenance (if needed)
- [ ] Review user feedback and issues

### Quarterly Tasks

- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Performance review and optimization
- [ ] Scaling assessment
- [ ] Documentation updates

## Backup Procedures

### Database Backups

**Supabase Automatic Backups**:

- Daily automatic backups enabled
- Point-in-time recovery available
- Backups retained for 7 days (free tier)
- Manual backup before major changes

**Manual Backup Process**:

1. Go to Supabase Dashboard
2. Navigate to Settings → Database
3. Click "Create Backup"
4. Download backup file
5. Store securely with date stamp

### Code Backups

- Primary: GitHub repository
- Releases: Tagged versions for major updates
- Local: Development environment copies

### Configuration Backups

- Environment variables documented
- Database schema in `complete-database-setup-fixed.sql`
- Deployment configuration in `render.yaml`

## Recovery Procedures

### Database Recovery

1. **Identify Issue**: Check error logs and symptoms
2. **Stop Application**: Prevent further data corruption
3. **Assess Damage**: Determine extent of data loss
4. **Restore Backup**: Use Supabase point-in-time recovery
5. **Verify Integrity**: Check data consistency
6. **Restart Application**: Resume normal operations
7. **Test Functionality**: Verify all features working

### Application Recovery

1. **Identify Failed Deployment**: Check Render logs
2. **Rollback Code**: Revert to last working commit
3. **Redeploy**: Push to main branch for auto-deploy
4. **Verify Health**: Check `/api/health` endpoint
5. **Test Core Features**: Login, upload, download
6. **Monitor**: Watch for recurring issues

### Full System Recovery

**Recovery Time Objective (RTO)**: < 2 hours
**Recovery Point Objective (RPO)**: < 24 hours

1. **Assessment Phase** (15 minutes):
   - Identify scope of outage
   - Determine root cause
   - Notify stakeholders

2. **Recovery Phase** (60 minutes):
   - Restore database from backup
   - Deploy last known good code
   - Verify environment variables
   - Test critical functionality

3. **Verification Phase** (30 minutes):
   - Full system testing
   - User acceptance testing
   - Performance verification
   - Security validation

4. **Post-Recovery** (15 minutes):
   - Update monitoring
   - Document incident
   - Notify users of restoration

## Performance Monitoring

### Key Metrics to Monitor

**Application Performance**:

- Response time < 2 seconds
- Error rate < 1%
- Uptime > 99.5%
- Memory usage < 80%

**Database Performance**:

- Query response time < 500ms
- Connection pool usage < 80%
- Storage usage monitoring
- Index performance

**User Experience**:

- Login success rate > 98%
- File upload success rate > 95%
- Page load time < 3 seconds

### Performance Optimization

**Database Optimization**:

```sql
-- Regular maintenance queries
ANALYZE;
VACUUM;

-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public';
```

**Application Optimization**:

- Monitor memory leaks
- Optimize file upload processing
- Review API endpoint performance
- Cache frequently accessed data

## Security Maintenance

### Security Monitoring

- Review `activity_logs` for suspicious activity
- Monitor failed login attempts
- Check for unusual file upload patterns
- Verify admin action logs

### Security Updates

- Keep Node.js dependencies updated
- Monitor security advisories
- Apply security patches promptly
- Review and update access controls

### Security Audits

**Monthly Security Checklist**:

- [ ] Review user access permissions
- [ ] Check for inactive accounts
- [ ] Verify admin account security
- [ ] Review API rate limiting effectiveness
- [ ] Check file upload security
- [ ] Verify database RLS policies

## System Scaling

### Scaling Triggers

- Memory usage > 80% consistently
- Database connections > 80% of pool
- API response time > 2 seconds
- Error rate > 2%

### Scaling Actions

**Vertical Scaling** (Render):

1. Upgrade to higher tier plan
2. Increase memory allocation
3. Monitor performance improvement

**Database Scaling** (Supabase):

1. Upgrade to Pro plan if needed
2. Increase connection pool size
3. Add read replicas for read-heavy workloads

**Horizontal Scaling** (Future):

- Load balancer configuration
- Multiple application instances
- Database sharding (if needed)

## Troubleshooting Common Issues

### Application Won't Start

1. Check environment variables
2. Verify database connectivity
3. Review startup logs
4. Check port availability
5. Verify Node.js version compatibility

### Database Connection Issues

1. Verify Supabase project status
2. Check connection string format
3. Test network connectivity
4. Review connection pool settings
5. Check for database maintenance

### File Upload Failures

1. Check file size limits (100MB)
2. Verify supported file types
3. Test with smaller files
4. Review server disk space
5. Check multer configuration

### Performance Issues

1. Check database query performance
2. Monitor memory usage
3. Review API response times
4. Check for memory leaks
5. Analyze slow endpoints

## Maintenance Scripts

### Health Check Script

```bash
#!/bin/bash
# health-check.sh
curl -f http://localhost:3000/api/health || exit 1
echo "Health check passed"
```

### Database Maintenance Script

```sql
-- maintenance.sql
-- Run monthly for database optimization
ANALYZE;
VACUUM;
REINDEX DATABASE your_database_name;
```

### Log Cleanup Script

```bash
#!/bin/bash
# cleanup-logs.sh
# Clean old activity logs (keep 90 days)
# Run via Supabase SQL editor or cron job
```

## Documentation Maintenance

### Keep Updated

- API documentation when endpoints change
- User guides when features change
- Security procedures when policies change
- Deployment guides when infrastructure changes

### Review Schedule

- Monthly: User guides and troubleshooting
- Quarterly: All documentation
- After major releases: All affected documentation

## Emergency Procedures

### System Down Emergency

1. **Immediate Response** (5 minutes):
   - Check Render dashboard status
   - Verify Supabase status
   - Check recent deployments

2. **Investigation** (15 minutes):
   - Review error logs
   - Check database connectivity
   - Verify environment variables

3. **Resolution** (30 minutes):
   - Apply fix or rollback
   - Monitor recovery
   - Test critical functions

4. **Communication**:
   - Update status page (if available)
   - Notify key stakeholders
   - Document incident

### Data Breach Response

1. **Immediate Containment**:
   - Disable affected accounts
   - Block suspicious IP addresses
   - Preserve evidence

2. **Assessment**:
   - Determine scope of breach
   - Identify affected data
   - Review audit logs

3. **Notification**:
   - Notify affected users
   - Report to authorities if required
   - Update security measures

## Contact Information

### Emergency Contacts

- **System Administrator**: admin@evid-dgc.com
- **Technical Support**: DGC2MHNE@proton.me
- **Security Issues**: GitHub repository issues

### Service Providers

- **Hosting**: Render.com support
- **Database**: Supabase support
- **Domain**: DNS provider support

### Escalation Procedures

1. Technical issues → System Administrator
2. Security issues → Immediate escalation
3. Service outages → All stakeholders
4. Data issues → Database administrator
