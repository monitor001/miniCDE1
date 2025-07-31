# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies for SSL
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies with npm
RUN npm config set registry https://registry.npmjs.org/ && \
    npm ci --no-optional && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/cache/nginx && \
    mkdir -p /var/log/nginx && \
    mkdir -p /var/run

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 