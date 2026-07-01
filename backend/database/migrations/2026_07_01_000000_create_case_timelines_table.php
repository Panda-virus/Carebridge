<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('case_timelines')) {
            Schema::create('case_timelines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('case_report_id')->constrained('case_reports')->cascadeOnDelete();
                $table->string('stage');
                $table->string('stage_label')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('due_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->string('assigned_role')->nullable();
                $table->json('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('case_timelines');
    }
};
