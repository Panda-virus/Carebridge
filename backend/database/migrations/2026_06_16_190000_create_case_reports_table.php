<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('case_reports')) {
            Schema::create('case_reports', function (Blueprint $table) {
                $table->id();
                $table->string('ticket_number')->nullable()->unique();
                $table->string('subject')->nullable();
                $table->string('category')->default('general');
                $table->string('detailed_category')->nullable();
                $table->string('sub_category')->nullable();
                $table->text('description');
                $table->string('status')->default('submitted');
                $table->string('workflow_stage')->nullable();
                $table->string('assigned_role')->nullable();
                $table->string('urgency_level')->default('medium');
                $table->boolean('requires_location_sharing')->default(false);
                $table->json('location')->nullable();
                $table->json('matched_keywords')->nullable();
                $table->boolean('is_anonymous')->default(false);
                $table->string('reported_by_type')->nullable();
                $table->date('incident_date')->nullable();
                $table->time('incident_time')->nullable();
                $table->string('incident_location')->nullable();
                $table->longText('evidence_files')->nullable();
                $table->string('student_name')->nullable();
                $table->string('student_email')->nullable();
                $table->string('student_phone')->nullable();
                $table->string('student_id')->nullable();
                $table->string('department')->nullable();
                $table->string('year_of_study')->nullable();
                $table->foreignId('student_id_fk')->nullable()->constrained('users')->nullOnDelete();
                $table->text('response_notes')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->string('reviewed_by')->nullable();
                $table->text('permission_request')->nullable();
                $table->timestamp('permission_approved_at')->nullable();
                $table->text('findings_report')->nullable();
                $table->text('meeting_notice')->nullable();
                $table->date('meeting_date')->nullable();
                $table->text('verdict')->nullable();
                // case_status_id and handler added in 2026_06_29 migration
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('case_reports');
    }
};
