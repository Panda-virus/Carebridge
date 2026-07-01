<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('case_reports')) {
            Schema::table('case_reports', function (Blueprint $table) {
                if (! Schema::hasColumn('case_reports', 'meeting_emails')) {
                    $table->json('meeting_emails')->nullable();
                }
                if (! Schema::hasColumn('case_reports', 'meeting_files')) {
                    $table->json('meeting_files')->nullable();
                }
                if (! Schema::hasColumn('case_reports', 'verdict_emails')) {
                    $table->json('verdict_emails')->nullable();
                }
                if (! Schema::hasColumn('case_reports', 'verdict_files')) {
                    $table->json('verdict_files')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('case_reports')) {
            Schema::table('case_reports', function (Blueprint $table) {
                if (Schema::hasColumn('case_reports', 'meeting_emails')) {
                    $table->dropColumn('meeting_emails');
                }
                if (Schema::hasColumn('case_reports', 'meeting_files')) {
                    $table->dropColumn('meeting_files');
                }
                if (Schema::hasColumn('case_reports', 'verdict_emails')) {
                    $table->dropColumn('verdict_emails');
                }
                if (Schema::hasColumn('case_reports', 'verdict_files')) {
                    $table->dropColumn('verdict_files');
                }
            });
        }
    }
};
