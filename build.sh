#!/bin/bash

echo "🚀 Bắt đầu build dự án miniCDE..."

# Build Backend
echo "📦 Building Backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Backend built successfully"
    else
        echo "❌ Backend build failed"
        exit 1
    fi
else
    echo "❌ Backend dependencies installation failed"
    exit 1
fi

# Build Frontend
echo "📦 Building Frontend..."
cd ../frontend
npm install --legacy-peer-deps
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Frontend built successfully"
    else
        echo "❌ Frontend build failed"
        exit 1
    fi
else
    echo "❌ Frontend dependencies installation failed"
    exit 1
fi

echo "🎉 Dự án đã được build thành công!"
echo "📁 Backend build: ./backend/dist"
echo "📁 Frontend build: ./frontend/build"