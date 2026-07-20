<?php

namespace Tests\Feature;

use App\Models\CaseReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentCaseVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_see_cases_they_reported_even_when_not_yet_linked_as_affected_student(): void
    {
        $student = User::factory()->create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'role' => 'student',
        ]);

        $this->actingAs($student, 'sanctum');

        CaseReport::create([
            'category' => 'general',
            'detailed_category' => 'general',
            'sub_category' => 'general',
            'description' => 'Student reported this concern',
            'status' => 'submitted',
            'urgency_level' => 'medium',
            'reported_by_user_id' => $student->id,
            'affected_student_id' => null,
            'subject' => 'Reported by student',
        ]);

        $response = $this->getJson('/api/case-reports');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'reported_by_user_id' => $student->id,
        ]);
    }
}
