<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('label');
            $table->string('handler'); // iic, registrar, investigator, disciplinary_committee
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('case_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('case_reports', 'case_status_id')) {
                $table->foreignId('case_status_id')->nullable()->after('status')->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('case_reports', 'handler')) {
                $table->string('handler')->nullable()->after('case_status_id');
            }
        });

        // Seed initial statuses
        DB::table('case_statuses')->insert([
            ['code' => 'submitted', 'label' => 'Submitted', 'handler' => 'investigator', 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'acknowledged', 'label' => 'Acknowledged', 'handler' => 'investigator', 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'preliminary_review', 'label' => 'Preliminary Review', 'handler' => 'registrar', 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'ongoing_investigation', 'label' => 'Ongoing Investigation', 'handler' => 'investigator', 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'investigation_complete', 'label' => 'Investigation Complete', 'handler' => 'registrar', 'sort_order' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'findings_under_review', 'label' => 'Findings Under Review', 'handler' => 'registrar', 'sort_order' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'referred_to_disciplinary_hearing', 'label' => 'Referred to Disciplinary Hearing', 'handler' => 'disciplinary_committee', 'sort_order' => 7, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'awaiting_disciplinary_hearing', 'label' => 'Awaiting Disciplinary Hearing', 'handler' => 'disciplinary_committee', 'sort_order' => 8, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'under_review', 'label' => 'Under Review', 'handler' => 'registrar', 'sort_order' => 9, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'verdict_served', 'label' => 'Verdict Served', 'handler' => 'registrar', 'sort_order' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'appealed', 'label' => 'Appealed', 'handler' => 'registrar', 'sort_order' => 11, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (Schema::hasColumn('case_reports', 'case_status_id')) {
                $table->dropForeign(['case_status_id']);
                $table->dropColumn('case_status_id');
            }
            if (Schema::hasColumn('case_reports', 'handler')) {
                $table->dropColumn('handler');
            }
        });

        Schema::dropIfExists('case_statuses');
    }
};
