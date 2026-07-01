# CareBridge one-time setup — run once on a new machine
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Stop"

Write-Host "=== CareBridge System Setup ===" -ForegroundColor Cyan

function Test-MySqlPort {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3306)
        $tcp.Close()
        return $true
    } catch { return $false }
}

# 1. Backend
Write-Host "`n[1/6] Backend dependencies..." -ForegroundColor Yellow
Set-Location "$Root\backend"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from .env.example — configure MAIL_* for real emails." -ForegroundColor Yellow
}
if ((Get-Content ".env" -Raw) -notmatch "APP_KEY=base64:") {
    php artisan key:generate
}
composer install --no-interaction -q 2>$null
if ($LASTEXITCODE -ne 0) { composer install --no-interaction }

# 2. MySQL
Write-Host "`n[2/6] Database..." -ForegroundColor Yellow
if (-not (Test-MySqlPort)) {
    Write-Host "  WARNING: MySQL not running. Start XAMPP MySQL, then re-run setup." -ForegroundColor Red
} else {
    php artisan migrate --force
    $userCount = php artisan tinker --execute="echo App\Models\User::count();" 2>&1
    if ($userCount -eq "0") {
        php artisan db:seed --force
        Write-Host "  Seeded demo users." -ForegroundColor Green
    }
}

# 3. AI service
Write-Host "`n[3/6] AI service..." -ForegroundColor Yellow
Set-Location "$Root\ai"
python -m pip install -r requirements.txt -q

# 4. Frontend
Write-Host "`n[4/6] Frontend..." -ForegroundColor Yellow
Set-Location "$Root\frontend"
if (-not (Test-Path "node_modules")) { npm install }

# 5. Storage directories
Write-Host "`n[5/6] Storage directories..." -ForegroundColor Yellow
Set-Location "$Root\backend"
New-Item -ItemType Directory -Force -Path "storage\backups" | Out-Null
New-Item -ItemType Directory -Force -Path "storage\provisioning" | Out-Null

# 6. Optional Windows scheduled tasks
Write-Host "`n[6/6] Optional automation tasks..." -ForegroundColor Yellow
$taskScript = "$Root\scripts\install-scheduled-tasks.ps1"
if (Test-Path $taskScript) {
    Write-Host "  Run as Administrator to install daily backup + scheduler tasks:" -ForegroundColor White
    Write-Host "    .\scripts\install-scheduled-tasks.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Setup complete. Next steps:" -ForegroundColor Green
Write-Host "  1. Edit backend\.env — set MAIL_MAILER=smtp and SMTP credentials for real emails" -ForegroundColor White
Write-Host "  2. Run .\start.ps1 to launch all services" -ForegroundColor White
Write-Host "  3. Import users: php artisan carebridge:import-users storage\provisioning\users.example.csv" -ForegroundColor White
