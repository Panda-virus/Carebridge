<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('case_reports', 'registrar_case_file_id')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->foreignId('registrar_case_file_id')->nullable()->after('registrar_case_file')->constrained('registrar_case_files')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('case_reports', 'registrar_case_file_id')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->dropConstrainedForeignId('registrar_case_file_id');
            });
        }
    }
};
