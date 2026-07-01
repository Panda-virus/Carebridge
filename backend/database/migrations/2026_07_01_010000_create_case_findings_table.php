<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('case_findings')) {
            Schema::create('case_findings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('case_report_id')->constrained('case_reports')->cascadeOnDelete();
                $table->string('case_number')->nullable();
                $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('findings_report')->nullable();
                $table->longText('findings_files')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('case_findings');
    }
};
