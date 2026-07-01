# Install Windows Task Scheduler jobs for CareBridge automation (run as Administrator)
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Backend = "$Root\backend"
$Php = (Get-Command php -ErrorAction SilentlyContinue).Source
if (-not $Php) {
    Write-Host "PHP not found in PATH." -ForegroundColor Red
    exit 1
}

$backupAction = New-ScheduledTaskAction -Execute $Php -Argument "artisan carebridge:backup-database" -WorkingDirectory $Backend
$backupTrigger = New-ScheduledTaskTrigger -Daily -At "02:00"
Register-ScheduledTask -TaskName "CareBridge-DatabaseBackup" -Action $backupAction -Trigger $backupTrigger -Description "Daily CareBridge MySQL backup" -Force

$followupAction = New-ScheduledTaskAction -Execute $Php -Argument "artisan carebridge:send-chat-followups" -WorkingDirectory $Backend
$followupTrigger = New-ScheduledTaskTrigger -Hourly
Register-ScheduledTask -TaskName "CareBridge-ChatFollowUps" -Action $followupAction -Trigger $followupTrigger -Description "Hourly CareBridge chatbot follow-up emails" -Force

Write-Host "Installed scheduled tasks:" -ForegroundColor Green
Write-Host "  CareBridge-DatabaseBackup  — daily at 02:00"
Write-Host "  CareBridge-ChatFollowUps   — hourly"
