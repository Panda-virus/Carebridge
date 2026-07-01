<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('case_reports', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('student_id_fk')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (Schema::hasColumn('case_reports', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
