<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normalize emails to lowercase (single source of truth per account)
        if (Schema::hasTable('users')) {
            foreach (DB::table('users')->get() as $user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['email' => strtolower($user->email)]);
            }
        }

        Schema::table('external_counselors', function (Blueprint $table) {
            if (! Schema::hasColumn('external_counselors', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
                $table->unique('user_id');
            }
        });

        // Link external counselor profiles to user accounts (remove duplicate identity)
        if (Schema::hasTable('external_counselors') && Schema::hasTable('users')) {
            $externals = DB::table('external_counselors')->get();
            foreach ($externals as $external) {
                if ($external->user_id) {
                    continue;
                }
                $userId = DB::table('users')
                    ->whereRaw('LOWER(email) = ?', [strtolower($external->email ?? '')])
                    ->value('id');
                if ($userId) {
                    DB::table('external_counselors')->where('id', $external->id)->update(['user_id' => $userId]);
                }
            }
        }

        Schema::table('case_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('case_reports', 'is_anonymous')) {
                $table->boolean('is_anonymous')->default(false)->after('status');
            }
        });

        if (Schema::hasTable('case_reports')) {
            DB::table('case_reports')
                ->whereNull('student_id')
                ->where(function ($query) {
                    $query->whereNull('student_name')->orWhere('student_name', '');
                })
                ->update(['is_anonymous' => true]);
        }

        // Backfill student_id on counseling requests from email before dropping denormalized columns
        if (Schema::hasTable('counseling_requests') && Schema::hasColumn('counseling_requests', 'student_email')) {
            $requests = DB::table('counseling_requests')->whereNull('student_id')->get();
            foreach ($requests as $request) {
                $userId = DB::table('users')
                    ->whereRaw('LOWER(email) = ?', [strtolower($request->student_email ?? '')])
                    ->value('id');
                if ($userId) {
                    DB::table('counseling_requests')->where('id', $request->id)->update(['student_id' => $userId]);
                }
            }
        }

        Schema::table('counseling_requests', function (Blueprint $table) {
            $columns = ['student_name', 'student_email', 'student_phone', 'counselor_name', 'external_counselor_info'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('counseling_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('counselor_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('counselor_schedules', 'counselor_name')) {
                $table->dropColumn('counselor_name');
            }
        });

        Schema::table('case_reports', function (Blueprint $table) {
            $columns = ['student_name', 'student_email', 'student_phone'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('case_reports', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('counselor_availability_slots');

        Schema::table('users', function (Blueprint $table) {
            $table->unique('phone');
        });
    }

    public function down(): void
    {
        Schema::create('counselor_availability_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('counselor_schedules')->cascadeOnDelete();
            $table->string('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('slot_duration')->default(60);
            $table->timestamps();
        });

        Schema::table('case_reports', function (Blueprint $table) {
            $table->string('student_name')->nullable();
            $table->string('student_email')->nullable();
            $table->string('student_phone')->nullable();
            if (Schema::hasColumn('case_reports', 'is_anonymous')) {
                $table->dropColumn('is_anonymous');
            }
        });

        Schema::table('counselor_schedules', function (Blueprint $table) {
            $table->string('counselor_name')->default('');
        });

        Schema::table('counseling_requests', function (Blueprint $table) {
            $table->string('student_name')->nullable();
            $table->string('student_email')->nullable();
            $table->string('student_phone')->nullable();
            $table->string('counselor_name')->nullable();
            $table->text('external_counselor_info')->nullable();
        });

        Schema::table('external_counselors', function (Blueprint $table) {
            if (Schema::hasColumn('external_counselors', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
        });
    }
};
