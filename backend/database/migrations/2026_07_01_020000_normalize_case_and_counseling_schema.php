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
                if (Schema::hasColumn('case_reports', 'student_id_fk')) {
                    $table->dropForeign(['student_id_fk']);
                    $table->dropColumn('student_id_fk');
                }

                if (Schema::hasColumn('case_reports', 'student_name')) {
                    $table->dropColumn('student_name');
                }
                if (Schema::hasColumn('case_reports', 'student_email')) {
                    $table->dropColumn('student_email');
                }
                if (Schema::hasColumn('case_reports', 'student_phone')) {
                    $table->dropColumn('student_phone');
                }
            });

            if (Schema::hasColumn('case_reports', 'student_id') && ! Schema::hasColumn('case_reports', 'student_id_fk')) {
                // Only add a foreign key if the existing student_id column is an integer type
                try {
                    $colType = Schema::getColumnType('case_reports', 'student_id');
                } catch (\Throwable $e) {
                    $colType = null;
                }
                if (in_array($colType, ['integer', 'bigint', 'int'])) {
                    Schema::table('case_reports', function (Blueprint $table) {
                        $table->foreign('student_id')->references('id')->on('users')->nullOnDelete();
                    });
                }
            }

            Schema::table('case_reports', function (Blueprint $table) {
                $table->index(['status', 'created_at']);
                $table->index('user_id');
                $table->index('case_status_id');
            });
        }

        if (Schema::hasTable('counseling_requests')) {
            Schema::table('counseling_requests', function (Blueprint $table) {
                $table->index('student_id');
                $table->index('counselor_id');
                $table->index('status');
                $table->index('external_counselor_id');
            });
        }

        if (Schema::hasTable('counseling_sessions')) {
            Schema::table('counseling_sessions', function (Blueprint $table) {
                $table->index('request_id');
                $table->index('completed');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('case_reports')) {
            Schema::table('case_reports', function (Blueprint $table) {
                $table->dropIndex(['status', 'created_at']);
                $table->dropIndex(['user_id']);
                $table->dropIndex(['case_status_id']);

                if (! Schema::hasColumn('case_reports', 'student_id_fk')) {
                    $table->foreignId('student_id_fk')->nullable()->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('case_reports', 'student_name')) {
                    $table->string('student_name')->nullable();
                }
                if (! Schema::hasColumn('case_reports', 'student_email')) {
                    $table->string('student_email')->nullable();
                }
                if (! Schema::hasColumn('case_reports', 'student_phone')) {
                    $table->string('student_phone')->nullable();
                }
            });
        }

        if (Schema::hasTable('counseling_requests')) {
            Schema::table('counseling_requests', function (Blueprint $table) {
                $table->dropIndex(['student_id']);
                $table->dropIndex(['counselor_id']);
                $table->dropIndex(['status']);
                $table->dropIndex(['external_counselor_id']);
            });
        }

        if (Schema::hasTable('counseling_sessions')) {
            Schema::table('counseling_sessions', function (Blueprint $table) {
                $table->dropIndex(['request_id']);
                $table->dropIndex(['completed']);
            });
        }
    }
};
