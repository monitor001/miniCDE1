# Admin Account & SSL/CORS Verification Checklist

## 🔐 Admin Account Verification

### ✅ Pre-deployment Checks

#### 1. Database & Seed Data
- [ ] Database connection working
- [ ] Prisma migrations applied
- [ ] Seed data creates admin account correctly
- [ ] Admin password is properly hashed
- [ ] Admin role is set to 'ADMIN'

#### 2. Authentication
- [ ] Login endpoint responds correctly
- [ ] JWT token generation works
- [ ] Token contains correct user info
- [ ] Token expiration is set correctly
- [ ] Password validation works

#### 3. Authorization
- [ ] Admin can access admin-only endpoints
- [ ] Role-based access control working
- [ ] User creation by admin works
- [ ] User management functions work

### ✅ Post-deployment Checks

#### 1. Production Login
```bash
# Test admin login
curl -X POST https://your-app.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenthanhvc@gmail.com",
    "password": "Ab5463698664#"
  }'
```

#### 2. Admin Access Test
```bash
# Test admin-only endpoint
curl -X GET https://your-app.herokuapp.com/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 3. User Creation Test
```bash
# Test creating new user
curl -X POST https://your-app.herokuapp.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "USER"
  }'
```

## 🔒 SSL Configuration Verification

### ✅ Development Environment
- [ ] HTTP requests work on localhost
- [ ] No SSL errors in development
- [ ] CORS allows localhost origins

### ✅ Production Environment
- [ ] HTTPS redirect working
- [ ] SSL certificates valid
- [ ] Security headers present
- [ ] HSTS header set
- [ ] No mixed content warnings

### ✅ SSL Test Commands
```bash
# Test SSL certificate
openssl s_client -connect your-app.herokuapp.com:443 -servername your-app.herokuapp.com

# Test HTTPS redirect
curl -I http://your-app.herokuapp.com
# Should redirect to https://

# Test security headers
curl -I https://your-app.herokuapp.com
# Should include security headers
```

## 🌐 CORS Configuration Verification

### ✅ Development CORS
- [ ] Frontend can connect to backend
- [ ] No CORS errors in browser console
- [ ] Localhost origins allowed
- [ ] Credentials supported

### ✅ Production CORS
- [ ] Frontend domain allowed
- [ ] Heroku domain allowed
- [ ] Custom domain allowed (if any)
- [ ] Preflight requests work

### ✅ CORS Test Commands
```bash
# Test CORS preflight
curl -X OPTIONS https://your-app.herokuapp.com/api/auth/login \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test actual request
curl -X POST https://your-app.herokuapp.com/api/auth/login \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

## 🛡️ Security Headers Verification

### ✅ Required Headers
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security (production)
- [ ] Content-Security-Policy
- [ ] Referrer-Policy

### ✅ Header Test
```bash
# Check all security headers
curl -I https://your-app.herokuapp.com | grep -E "(X-|Strict-|Content-|Referrer-)"
```

## 🔍 Comprehensive Testing

### ✅ Automated Tests
```bash
# Run admin account tests
node test-admin-login.js

# Run SSL/CORS tests
node test-ssl-cors.js
```

### ✅ Manual Tests
- [ ] Login through frontend
- [ ] Access admin panel
- [ ] Create new user
- [ ] Test all admin functions
- [ ] Check browser console for errors

## 🚨 Common Issues & Solutions

### ❌ Admin Login Fails
**Possible causes:**
- Database not seeded
- Wrong password
- JWT secret not set
- Database connection issues

**Solutions:**
```bash
# Re-seed database
npm run db:seed

# Check environment variables
echo $JWT_SECRET
echo $DATABASE_URL

# Test database connection
npm run db:studio
```

### ❌ CORS Errors
**Possible causes:**
- Frontend domain not in CORS whitelist
- Missing CORS headers
- Wrong protocol (HTTP vs HTTPS)

**Solutions:**
```typescript
// Update CORS configuration
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'https://your-app.herokuapp.com'
  ],
  credentials: true
};
```

### ❌ SSL Issues
**Possible causes:**
- Invalid SSL certificate
- Mixed content (HTTP/HTTPS)
- Missing security headers

**Solutions:**
```javascript
// Force HTTPS redirect
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

## 📊 Monitoring & Alerts

### ✅ Health Checks
- [ ] `/health` endpoint responding
- [ ] `/health/db` endpoint responding
- [ ] Admin login working
- [ ] No critical errors in logs

### ✅ Log Monitoring
- [ ] Authentication attempts logged
- [ ] Admin actions logged
- [ ] Error logs monitored
- [ ] Performance metrics tracked

## 🎯 Final Verification Steps

### ✅ Before Production
1. **Run all tests**: `node test-admin-login.js`
2. **Check SSL**: Verify HTTPS redirect and certificates
3. **Test CORS**: Ensure frontend can connect
4. **Verify admin**: Login and test all admin functions
5. **Security scan**: Check for vulnerabilities

### ✅ After Production
1. **Monitor logs**: Check for errors
2. **Test user creation**: Create test user
3. **Verify access control**: Test role-based permissions
4. **Performance check**: Monitor response times
5. **Security audit**: Regular security reviews

## 📝 Documentation

### ✅ Update Documentation
- [ ] Admin credentials documented
- [ ] SSL configuration documented
- [ ] CORS settings documented
- [ ] Troubleshooting guide updated
- [ ] Deployment instructions updated

---

**Status**: ✅ Ready for production deployment
**Last Updated**: [Current Date]
**Verified By**: [Your Name] 