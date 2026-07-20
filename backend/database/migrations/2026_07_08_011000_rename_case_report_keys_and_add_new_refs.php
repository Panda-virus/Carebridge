<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('case_reports', 'affected_student_id')) {
                $table->unsignedBigInteger('affected_student_id')->nullable()->after('student_id');
            }
            if (! Schema::hasColumn('case_reports', 'reported_by_user_id')) {
                $table->unsignedBigInteger('reported_by_user_id')->nullable()->after('user_id');
            }
        });

        // Copy existing data
        DB::table('case_reports')->whereNotNull('student_id')->update(['affected_student_id' => DB::raw('student_id')]);
        DB::table('case_reports')->whereNotNull('user_id')->update(['reported_by_user_id' => DB::raw('user_id')]);

        // Add foreign keys
        Schema::table('case_reports', function (Blueprint $table) {
            $table->foreign('affected_student_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('reported_by_user_id')->references('id')->on('users')->onDelete('set null');
        });

        // Remove registrar_case_file_id (we will keep data migration to evidence_files later)
        if (Schema::hasColumn('case_reports', 'registrar_case_file_id')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->dropForeign(['registrar_case_file_id']);
                $table->dropColumn('registrar_case_file_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (Schema::hasColumn('case_reports', 'affected_student_id')) {
                $table->dropForeign(['affected_student_id']);
                $table->dropColumn('affected_student_id');
            }
            if (Schema::hasColumn('case_reports', 'reported_by_user_id')) {
                $table->dropForeign(['reported_by_user_id']);
                $table->dropColumn('reported_by_user_id');
            }
        });
    }
};
