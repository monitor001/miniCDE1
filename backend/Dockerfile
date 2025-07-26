FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN apk add --no-cache python3 make g++ postgresql-client openssl openssl-dev
RUN npm install
RUN npx prisma generate

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Start the app
CMD ["node", "dist/index.js"] 