<?php

namespace App\Providers;

use App\Services\DatabaseBootstrapService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (! $this->app->runningUnitTests()) {
            $this->app->make(DatabaseBootstrapService::class)->ensureReady();
        }
    }
}
