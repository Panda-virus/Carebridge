<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('case_timelines', function (Blueprint $table) {
            if (! Schema::hasColumn('case_timelines', 'performed_by')) {
                $table->unsignedBigInteger('performed_by')->nullable()->after('id');
            }
            if (! Schema::hasColumn('case_timelines', 'remarks')) {
                $table->text('remarks')->nullable()->after('performed_by');
            }
        });

        Schema::table('case_timelines', function (Blueprint $table) {
            $table->foreign('performed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('case_timelines', function (Blueprint $table) {
            if (Schema::hasColumn('case_timelines', 'performed_by')) {
                $table->dropForeign(['performed_by']);
                $table->dropColumn('performed_by');
            }
            if (Schema::hasColumn('case_timelines', 'remarks')) {
                $table->dropColumn('remarks');
            }
        });
    }
};
