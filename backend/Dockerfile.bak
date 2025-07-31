# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for SSL and other utilities
RUN apk add --no-cache openssl curl

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm config set registry https://registry.npmjs.org/ && \
    npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove devDependencies and source files to reduce image size
RUN npm prune --production && \
    rm -rf src/ && \
    rm -rf node_modules/.cache/ && \
    rm -rf .git/ && \
    rm -rf tests/ && \
    rm -rf *.md && \
    rm -rf .env.example

# Create necessary directories
RUN mkdir -p uploads && \
    mkdir -p logs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"] 