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
                $table->string('assigned_role')->nullable()->default(null)->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('case_reports')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->string('assigned_role')->default('iic')->nullable(false)->change();
            });
        }
    }
};
