<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('case_permission_requests')) {
            Schema::create('case_permission_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('case_report_id')->constrained('case_reports')->cascadeOnDelete();
                $table->text('request_text')->nullable();
                $table->string('status')->default('pending');
                $table->string('requested_by')->nullable();
                $table->timestamp('requested_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('case_permission_requests');
    }
};
