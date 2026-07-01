<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('counseling_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('student_name');
            $table->string('student_email');
            $table->string('student_phone')->nullable();
            $table->text('concern');
            $table->string('category')->nullable();
            $table->string('urgency_level');
            $table->string('preferred_time')->nullable();
            $table->string('status')->default('pending_review');
            $table->boolean('requires_immediate_attention')->default(false);
            $table->json('matched_keywords')->nullable();

            $table->date('proposed_date')->nullable();
            $table->time('proposed_time')->nullable();
            $table->boolean('student_approved')->nullable();
            $table->boolean('counselor_approved')->nullable();

            $table->foreignId('counselor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('counselor_name')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->unsignedTinyInteger('total_sessions')->nullable();
            $table->unsignedTinyInteger('completed_sessions')->nullable();
            $table->json('session_notes')->nullable();
            $table->text('recommendations')->nullable();
            $table->text('referral_reason')->nullable();
            $table->text('external_counselor_info')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('counseling_requests');
    }
};
