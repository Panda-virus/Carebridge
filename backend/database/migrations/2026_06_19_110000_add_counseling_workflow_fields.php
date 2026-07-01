<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('schedule_setup_at')->nullable()->after('is_external');
        });

        Schema::table('counseling_requests', function (Blueprint $table) {
            $table->json('session_scores')->nullable()->after('session_notes');
            $table->decimal('overall_score', 5, 2)->nullable()->after('session_scores');
            $table->json('external_session_records')->nullable()->after('overall_score');
        });

        Schema::table('counseling_sessions', function (Blueprint $table) {
            $table->unsignedTinyInteger('score')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('counseling_sessions', function (Blueprint $table) {
            $table->dropColumn('score');
        });

        Schema::table('counseling_requests', function (Blueprint $table) {
            $table->dropColumn(['session_scores', 'overall_score', 'external_session_records']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('schedule_setup_at');
        });
    }
};
