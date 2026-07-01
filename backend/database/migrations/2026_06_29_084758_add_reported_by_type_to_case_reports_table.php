<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            // Add reported_by_type column (victim, concerned_friend, witness)
            if (!Schema::hasColumn('case_reports', 'reported_by_type')) {
                $table->string('reported_by_type')->nullable()->after('description');
            }

            // Add incident_time column to complement incident_date
            if (!Schema::hasColumn('case_reports', 'incident_time')) {
                $table->time('incident_time')->nullable()->after('incident_date');
            }

            // Ensure subject column exists as title
            if (!Schema::hasColumn('case_reports', 'subject')) {
                $table->string('subject')->nullable()->after('ticket_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            $columns = ['reported_by_type', 'incident_time', 'subject'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('case_reports', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
