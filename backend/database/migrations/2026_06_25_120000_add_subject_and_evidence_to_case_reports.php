<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('case_reports', 'subject')) {
                $table->string('subject')->nullable()->after('detailed_category');
            }
            if (! Schema::hasColumn('case_reports', 'evidence_files')) {
                $table->longText('evidence_files')->nullable()->after('incident_location');
            }
        });
    }

    public function down(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (Schema::hasColumn('case_reports', 'subject')) {
                $table->dropColumn('subject');
            }
            if (Schema::hasColumn('case_reports', 'evidence_files')) {
                $table->dropColumn('evidence_files');
            }
        });
    }
};
