<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('carebridge:send-chat-followups')->hourly();
Schedule::command('carebridge:backup-database')->dailyAt('02:00');
Schedule::command('carebridge:check-overdue-stages')->hourly();
