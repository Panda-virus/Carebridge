# CareBridge System — single Laravel web app (migrate, seed, API, UI on one port)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = "$Root\backend"
$ErrorActionPreference = "Stop"

Write-Host "=== CareBridge System (Laravel Web App) ===" -ForegroundColor Cyan

function Test-MySqlPort {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3306)
        $tcp.Close()
        return $true
    } catch { return $false }
}

function Start-XamppMySql {
    if (Test-Path "C:\xampp\mysql_start.bat") {
        Write-Host "Starting XAMPP MySQL..." -ForegroundColor Yellow
        Start-Process -FilePath "C:\xampp\mysql_start.bat" -WindowStyle Hidden
        Start-Sleep -Seconds 5
        return Test-MySqlPort
    }
    return $false
}

Write-Host "`n[1/4] MySQL check..." -ForegroundColor Yellow
if (-not (Test-MySqlPort)) {
    if (-not (Start-XamppMySql)) {
        Write-Host "ERROR: Start XAMPP MySQL first, then re-run .\start.ps1" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  MySQL OK" -ForegroundColor Green

Write-Host "`n[2/4] AI service..." -ForegroundColor Yellow
Set-Location "$Root\ai"
python -m pip install -r requirements.txt -q
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; python -m uvicorn ai.main:app --host 127.0.0.1 --port 8100"
Start-Sleep -Seconds 2

Write-Host "`n[3/4] Laravel setup (migrate + seed)..." -ForegroundColor Yellow
Set-Location $Backend
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env"; php artisan key:generate }
php artisan migrate --force
$userCount = php artisan tinker --execute="echo App\Models\User::count();" 2>&1
if ($userCount -eq "0") { php artisan db:seed --force; Write-Host "  Seeded demo users" -ForegroundColor Green }

if (-not (Test-Path "$Root\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "$Root\frontend"
    npm install
    Set-Location $Backend
}

Write-Host "`n[4/4] Starting Laravel web app..." -ForegroundColor Yellow
Write-Host "  Site + API -> http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  AI Service -> http://127.0.0.1:8100" -ForegroundColor Cyan
Write-Host "  Login: student@mzuni.ac.mw / student01" -ForegroundColor Cyan
Write-Host ""
Write-Host "Do NOT run 'npm run dev' from project root - use this script only." -ForegroundColor Yellow

Write-Host ""

composer run dev

