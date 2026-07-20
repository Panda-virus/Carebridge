<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('evidence_files', function (Blueprint $table) {
            if (! Schema::hasColumn('evidence_files', 'reference_type')) {
                $table->string('reference_type')->nullable()->after('case_id');
            }
            if (! Schema::hasColumn('evidence_files', 'reference_id')) {
                $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');
            }
            // Make case_id nullable (polymorphic may be used instead)
            $table->unsignedBigInteger('case_id')->nullable()->change();
        });

        Schema::table('evidence_files', function (Blueprint $table) {
            $table->index(['reference_type', 'reference_id']);
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('case_id')->references('id')->on('case_reports')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('evidence_files', function (Blueprint $table) {
            if (Schema::hasColumn('evidence_files', 'reference_type')) {
                $table->dropIndex(['reference_type', 'reference_id']);
                $table->dropColumn('reference_type');
            }
            if (Schema::hasColumn('evidence_files', 'reference_id')) {
                $table->dropColumn('reference_id');
            }
        });
    }
};
