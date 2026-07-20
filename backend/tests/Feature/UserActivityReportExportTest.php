<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserActivityReportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_download_user_activity_report(): void
    {
        $admin = User::factory()->create([
            'role' => 'system_administrator',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->get('/api/reports/users/export?format=html');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/html; charset=utf-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="carebridge-user-activity-report-all.html"');
    }
}
