<?php

namespace Tests\Feature;

use App\Models\CaseReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrarWorkflowActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_referral_sets_disciplinary_status_and_registrar_action(): void
    {
        $user = User::create([
            'name' => 'Registrar',
            'email' => 'registrar@example.com',
            'password' => 'password123',
            'role' => 'registrar',
        ]);

        $caseReport = CaseReport::create([
            'description' => 'Test case',
            'status' => 'findings_under_review',
            'workflow_stage' => 'findings_with_registrar',
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/case-reports/' . $caseReport->id . '/workflow/forward-to-disciplinary', [
                'response_notes' => 'Refer to disciplinary hearing',
            ]);

        $response->assertOk();
        $this->assertSame('referred_to_disciplinary_hearing', $caseReport->fresh()->status);
        $this->assertSame('with_disciplinary', $caseReport->fresh()->workflow_stage);
        $this->assertSame('referred', $caseReport->fresh()->registrar_action);
    }

    public function test_dismissal_sets_closed_status_and_registrar_action(): void
    {
        $user = User::create([
            'name' => 'Registrar',
            'email' => 'registrar2@example.com',
            'password' => 'password123',
            'role' => 'registrar',
        ]);

        $caseReport = CaseReport::create([
            'description' => 'Test case',
            'status' => 'findings_under_review',
            'workflow_stage' => 'findings_with_registrar',
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/case-reports/' . $caseReport->id . '/workflow/dismiss-case', [
                'reason' => 'Dismiss for insufficient evidence',
            ]);

        $response->assertOk();
        $this->assertSame('closed', $caseReport->fresh()->status);
        $this->assertSame('closed', $caseReport->fresh()->workflow_stage);
        $this->assertSame('dismissed', $caseReport->fresh()->registrar_action);
    }
}
