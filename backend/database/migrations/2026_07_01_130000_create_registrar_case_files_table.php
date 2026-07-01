<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('registrar_case_files')) {
            Schema::create('registrar_case_files', function (Blueprint $table) {
                $table->id();
                $table->foreignId('case_report_id')->constrained('case_reports')->cascadeOnDelete();
                $table->string('case_number')->nullable();
                $table->string('case_title')->nullable();
                $table->string('action_label')->nullable();
                $table->text('recommendation')->nullable();
                $table->longText('description')->nullable();
                $table->longText('findings_report')->nullable();
                $table->longText('findings_files')->nullable();
                $table->longText('content')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('registrar_case_files');
    }
};
