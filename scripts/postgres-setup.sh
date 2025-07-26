#!/bin/bash

echo "🐘 Setting up PostgreSQL for miniCDE..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Install PostgreSQL dependencies
echo "📦 Installing PostgreSQL dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init_postgres

# Seed database (optional)
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ PostgreSQL setup completed!"
echo "📊 Database URL: postgresql://minicde_user:minicde_password@localhost:5432/minicde"
echo "🔧 You can now run: npm run dev" 