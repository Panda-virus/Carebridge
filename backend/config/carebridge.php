<?php

return [
    'auto_migrate' => env('CAREBRIDGE_AUTO_MIGRATE', true),
    'chat_follow_up_hours' => (int) env('CAREBRIDGE_CHAT_FOLLOW_UP_HOURS', 24),
    'backup_retention_days' => (int) env('CAREBRIDGE_BACKUP_RETENTION_DAYS', 14),
    'frontend_url' => env('CAREBRIDGE_FRONTEND_URL', 'http://127.0.0.1:5173'),
];
