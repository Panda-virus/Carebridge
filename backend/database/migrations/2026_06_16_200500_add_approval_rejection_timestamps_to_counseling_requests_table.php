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
        Schema::table('counseling_requests', function (Blueprint $table) {
            $table->timestamp('student_rejected_at')->nullable()->after('student_approved');
            $table->timestamp('counselor_rejected_at')->nullable()->after('student_rejected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('counseling_requests', function (Blueprint $table) {
            $table->dropColumn(['student_rejected_at', 'counselor_rejected_at']);
        });
    }
};
