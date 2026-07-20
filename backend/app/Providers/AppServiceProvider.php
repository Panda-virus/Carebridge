<?php

namespace App\Providers;

use App\Services\DatabaseBootstrapService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Models\EvidenceFile;
use App\Policies\EvidenceFilePolicy;

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

        // Ensure EvidenceFile policy is registered even if AuthServiceProvider isn't wired
        Gate::policy(EvidenceFile::class, EvidenceFilePolicy::class);
    }
}
