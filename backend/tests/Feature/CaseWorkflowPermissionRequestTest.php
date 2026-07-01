<?php

namespace Tests\Feature;

use App\Models\CaseReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseWorkflowPermissionRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_request_permission_creates_a_permission_request_record(): void
    {
        $user = User::create([
            'name' => 'IIC Officer',
            'email' => 'iic@example.com',
            'password' => 'password123',
            'role' => 'iic',
        ]);

        $caseReport = CaseReport::create([
            'description' => 'Test case',
            'status' => 'submitted',
            'workflow_stage' => 'at_iic',
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/case-reports/' . $caseReport->id . '/workflow/request-permission', [
                'permission_request' => 'Please allow us to investigate this matter.',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('case_permission_requests', [
            'case_report_id' => $caseReport->id,
            'request_text' => 'Please allow us to investigate this matter.',
            'status' => 'pending',
        ]);

        $this->assertSame('permission_pending', $caseReport->fresh()->workflow_stage);
    }
}
