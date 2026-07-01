<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class DatabaseBootstrapService
{
    public function ensureReady(): void
    {
        if (! config('carebridge.auto_migrate', true)) {
            return;
        }

        $cacheKey = 'carebridge_db_bootstrapped';

        if (Cache::has($cacheKey)) {
            return;
        }

        try {
            if (! Schema::hasTable('users')) {
                Artisan::call('migrate', ['--force' => true]);
            } else {
                Artisan::call('migrate', ['--force' => true]);
            }

            if (User::count() === 0) {
                Artisan::call('db:seed', ['--force' => true]);
                Log::info('CareBridge: database seeded with demo users.');
            }

            Cache::put($cacheKey, true, now()->addHour());
        } catch (\Throwable $e) {
            Log::warning('CareBridge database bootstrap failed: '.$e->getMessage());
        }
    }
}
