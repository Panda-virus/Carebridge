<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaNormalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_case_and_counseling_tables_use_the_normalized_columns(): void
    {
        $this->assertTrue(Schema::hasTable('case_reports'));
        $this->assertTrue(Schema::hasTable('counseling_requests'));
        $this->assertTrue(Schema::hasTable('counseling_sessions'));

        $this->assertTrue(Schema::hasColumn('case_reports', 'student_id'));
        $this->assertFalse(Schema::hasColumn('case_reports', 'student_id_fk'));
        $this->assertFalse(Schema::hasColumn('case_reports', 'student_name'));
        $this->assertFalse(Schema::hasColumn('case_reports', 'student_email'));
        $this->assertFalse(Schema::hasColumn('case_reports', 'student_phone'));

        $this->assertTrue(Schema::hasColumn('counseling_requests', 'student_id'));
        $this->assertTrue(Schema::hasColumn('counseling_requests', 'counselor_id'));
        $this->assertTrue(Schema::hasColumn('counseling_sessions', 'request_id'));
    }
}
