<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('case_reports', 'registrar_action')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->string('registrar_action')->nullable()->after('findings_files');
                $table->text('registrar_action_reason')->nullable()->after('registrar_action');
                $table->longText('registrar_case_file')->nullable()->after('registrar_action_reason');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('case_reports', 'registrar_case_file')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->dropColumn(['registrar_case_file', 'registrar_action_reason', 'registrar_action']);
            });
        }
    }
};
