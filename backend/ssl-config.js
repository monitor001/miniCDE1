const fs = require('fs');
const path = require('path');

// SSL Configuration for production
const sslConfig = {
  // Development - no SSL
  development: {
    enabled: false,
    options: {}
  },
  
  // Production - with SSL
  production: {
    enabled: true,
    options: {
      // Heroku automatically provides SSL certificates
      // For custom domains, you would specify certificate paths:
      // key: fs.readFileSync('/path/to/private-key.pem'),
      // cert: fs.readFileSync('/path/to/certificate.pem'),
      // ca: fs.readFileSync('/path/to/ca-bundle.pem'),
      
      // SSL configuration
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA512',
        'DHE-RSA-AES256-GCM-SHA512',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES256-GCM-SHA384'
      ].join(':'),
      
      // Security headers
      honorCipherOrder: true,
      requestCert: false,
      rejectUnauthorized: false
    }
  }
};

// Environment-specific configuration
function getSSLConfig() {
  const env = process.env.NODE_ENV || 'development';
  return sslConfig[env] || sslConfig.development;
}

// HTTPS redirect middleware
function httpsRedirect(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    // Check if request is HTTP
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      // Redirect to HTTPS
      return res.redirect(`https://${req.get('host')}${req.url}`);
    }
  }
  next();
}

// Security headers middleware
function securityHeaders(req, res, next) {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-src 'none'",
    "object-src 'none'"
  ].join('; '));
  
  next();
}

module.exports = {
  getSSLConfig,
  httpsRedirect,
  securityHeaders,
  sslConfig
}; 