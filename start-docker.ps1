# MiniCDE Docker Build Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "    MiniCDE Docker Build Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check Docker installation
Write-Host "[1/5] Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Docker Desktop
Write-Host "[2/5] Starting Docker Desktop..." -ForegroundColor Yellow
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Start-Process $dockerPath -WindowStyle Hidden
    Write-Host "✓ Docker Desktop started" -ForegroundColor Green
    Write-Host "Waiting for Docker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
} else {
    Write-Host "⚠ Docker Desktop not found at expected path" -ForegroundColor Yellow
    Write-Host "Please start Docker Desktop manually" -ForegroundColor Yellow
}

# Check Docker daemon
Write-Host "[3/5] Checking Docker daemon..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
do {
    $attempt++
    try {
        docker ps | Out-Null
        Write-Host "✓ Docker daemon is running" -ForegroundColor Green
        break
    } catch {
        if ($attempt -eq $maxAttempts) {
            Write-Host "✗ ERROR: Docker daemon is not running after $maxAttempts attempts" -ForegroundColor Red
            Write-Host "Please start Docker Desktop manually and try again" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "Waiting for Docker daemon... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
} while ($attempt -lt $maxAttempts)

# Build and start containers
Write-Host "[4/5] Building and starting containers..." -ForegroundColor Yellow
try {
    docker-compose down
    Write-Host "✓ Stopped existing containers" -ForegroundColor Green
    
    docker-compose build --no-cache
    Write-Host "✓ Built containers" -ForegroundColor Green
    
    docker-compose up -d
    Write-Host "✓ Started containers" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to build or start containers" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check container status
Write-Host "[5/5] Checking container status..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Database: localhost:5432" -ForegroundColor Cyan
Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit" 