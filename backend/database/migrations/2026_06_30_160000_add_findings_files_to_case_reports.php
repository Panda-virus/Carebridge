<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('case_reports', 'findings_files')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->longText('findings_files')->nullable()->after('findings_report');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('case_reports', 'findings_files')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->dropColumn('findings_files');
            });
        }
    }
};
