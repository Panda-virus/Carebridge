# CareBridge database backup wrapper
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location "$Root\backend"
php artisan carebridge:backup-database
exit $LASTEXITCODE
