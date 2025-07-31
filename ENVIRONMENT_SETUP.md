# 🌍 Environment Configuration Setup

## 📁 File Structure

```
miniCDE/
├── env.development     # Development environment config
├── env.production      # Production environment config (Heroku)
├── frontend/.env       # Frontend environment variables
├── backend/.env        # Backend environment variables
├── load-env.js         # Environment loader script
└── ENVIRONMENT_SETUP.md # This documentation
```

## 🚀 Quick Start

### 1. Load Environment Variables
```bash
# Load production environment
node load-env.js load production

# Load development environment
node load-env.js load development
```

### 2. Create .env Files
```bash
# Create .env files for production
node load-env.js create production

# Create .env files for development
node load-env.js create development
```

### 3. Deploy to Heroku
```bash
# Generate Heroku deployment commands
node load-env.js deploy
```

## 📋 Environment Variables

### Frontend Variables (REACT_APP_*)
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - WebSocket URL
- `REACT_APP_TITLE` - Application title
- `REACT_APP_REQUEST_TIMEOUT` - API request timeout
- `REACT_APP_DEBUG_MODE` - Enable debug mode
- `REACT_APP_DEVTOOLS` - Enable React DevTools

### Backend Variables
- `NODE_ENV` - Node environment
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed CORS origins
- `REDIS_URL` - Redis connection string
- `TRUST_PROXY` - Trust proxy setting
- `RATE_LIMIT_MAX_REQUESTS` - Rate limiting
- `PROJECT_PATH` - Heroku subdir buildpack path

### Build Configuration
- `GENERATE_SOURCEMAP` - Generate source maps
- `INLINE_RUNTIME_CHUNK` - Inline runtime chunk

## 🔧 Development Setup

### 1. Create Development Environment
```bash
# Create .env files for development
node load-env.js create development
```

### 2. Start Development Servers
```bash
# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm start
```

## 🚀 Production Deployment

### 1. Create Production Environment
```bash
# Create .env files for production
node load-env.js create production
```

### 2. Deploy to Heroku
```bash
# Generate Heroku commands
node load-env.js deploy

# Run the generated commands
heroku config:set REACT_APP_API_URL="..." --app minicde-production
heroku config:set DATABASE_URL="..." --app minicde-production
# ... (run all generated commands)

# Deploy application
git push heroku main
```

## 📊 Environment Comparison

| Variable | Development | Production |
|----------|-------------|------------|
| NODE_ENV | development | production |
| REACT_APP_API_URL | http://localhost:3001/api | https://minicde-production-589be4b0d52b.herokuapp.com/api |
| DATABASE_URL | localhost:5432 | Heroku PostgreSQL |
| JWT_SECRET | dev_key | production_key |
| DEBUG_MODE | true | false |
| GENERATE_SOURCEMAP | true | false |

## 🔒 Security Notes

### Production Security
- JWT secrets are different for each environment
- CORS origins are restricted in production
- Debug mode is disabled in production
- Source maps are disabled in production
- Rate limiting is enabled in production

### Environment Variables
- Never commit `.env` files to version control
- Use `env.*` files for configuration templates
- Use Heroku config vars for production secrets

## 🛠️ Troubleshooting

### Common Issues

1. **Environment not loading**
   ```bash
   # Check if config file exists
   ls env.production
   
   # Load environment manually
   node load-env.js load production
   ```

2. **Frontend build issues**
   ```bash
   # Recreate frontend .env
   node load-env.js create production
   
   # Clean and rebuild
   cd frontend && rm -rf build && npm run build
   ```

3. **Heroku deployment issues**
   ```bash
   # Check Heroku config vars
   heroku config --app minicde-production
   
   # Update config vars
   node load-env.js deploy
   ```

### Debug Commands

```bash
# Check environment files
ls -la env.*

# Check .env files
ls -la frontend/.env backend/.env

# Test environment loading
node load-env.js load production

# Verify Heroku config
heroku config --app minicde-production
```

## 📝 Maintenance

### Adding New Variables

1. Add to `env.development` and `env.production`
2. Update documentation
3. Test with `node load-env.js create production`
4. Deploy to Heroku if needed

### Updating Production

1. Update `env.production`
2. Run `node load-env.js deploy`
3. Execute generated Heroku commands
4. Deploy application

## 🔄 Workflow

### Development Workflow
1. `node load-env.js create development`
2. Start development servers
3. Make changes
4. Test locally

### Production Workflow
1. `node load-env.js create production`
2. `node load-env.js deploy`
3. Execute Heroku commands
4. `git push heroku main`
5. Verify deployment

---

**Last Updated:** 2025-07-31
**Version:** 2.0.0 