<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('label')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Case categories
        Schema::create('case_categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('slug')->unique();
            $table->string('name');
            $table->timestamps();
        });

        // Urgency levels
        Schema::create('urgency_levels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('slug')->unique();
            $table->string('name');
            $table->integer('priority')->default(0);
            $table->timestamps();
        });

        // Add role_id to users and migrate existing string roles
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id')->nullable()->after('id');
        });

        // Seed roles from existing users.role strings
        $roles = DB::table('users')->select('role')->whereNotNull('role')->distinct()->pluck('role');
        foreach ($roles as $r) {
            DB::table('roles')->insertOrIgnore(['name' => $r, 'label' => ucfirst($r), 'created_at' => now(), 'updated_at' => now()]);
        }

        // Map users.role -> users.role_id
        $roleMap = DB::table('roles')->pluck('id', 'name');
        $users = DB::table('users')->select('id', 'role')->get();
        foreach ($users as $u) {
            if ($u->role && isset($roleMap[$u->role])) {
                DB::table('users')->where('id', $u->id)->update(['role_id' => $roleMap[$u->role]]);
            }
        }

        // Keep the old `role` column (string) for now to avoid breaking runtime; removing can be a follow-up.

        // Add lookup columns to case_reports: category_id, urgency_level_id
        Schema::table('case_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('case_reports', 'category_id')) {
                $table->unsignedBigInteger('category_id')->nullable()->after('category');
            }
            if (! Schema::hasColumn('case_reports', 'urgency_level_id')) {
                $table->unsignedBigInteger('urgency_level_id')->nullable()->after('urgency_level');
            }
        });

        // Migrate existing category and urgency strings into lookup tables
        $categories = DB::table('case_reports')->select('category')->whereNotNull('category')->distinct()->pluck('category');
        foreach ($categories as $c) {
            DB::table('case_categories')->insertOrIgnore(['slug' => $c, 'name' => ucfirst(str_replace('_', ' ', $c)), 'created_at' => now(), 'updated_at' => now()]);
        }
        $catMap = DB::table('case_categories')->pluck('id', 'slug');
        foreach (DB::table('case_reports')->select('id', 'category')->whereNotNull('category')->get() as $r) {
            if ($r->category && isset($catMap[$r->category])) {
                DB::table('case_reports')->where('id', $r->id)->update(['category_id' => $catMap[$r->category]]);
            }
        }

        $urgencies = DB::table('case_reports')->select('urgency_level')->whereNotNull('urgency_level')->distinct()->pluck('urgency_level');
        $prio = ['low' => 10, 'medium' => 20, 'high' => 30, 'critical' => 40, 'immediate' => 50];
        foreach ($urgencies as $u) {
            DB::table('urgency_levels')->insertOrIgnore(['slug' => $u, 'name' => ucfirst($u), 'priority' => $prio[$u] ?? 0, 'created_at' => now(), 'updated_at' => now()]);
        }
        $urgMap = DB::table('urgency_levels')->pluck('id', 'slug');
        foreach (DB::table('case_reports')->select('id', 'urgency_level')->whereNotNull('urgency_level')->get() as $r) {
            if ($r->urgency_level && isset($urgMap[$r->urgency_level])) {
                DB::table('case_reports')->where('id', $r->id)->update(['urgency_level_id' => $urgMap[$r->urgency_level]]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('case_reports', function (Blueprint $table) {
            if (Schema::hasColumn('case_reports', 'category_id')) {
                $table->dropColumn('category_id');
            }
            if (Schema::hasColumn('case_reports', 'urgency_level_id')) {
                $table->dropColumn('urgency_level_id');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role_id')) {
                $table->dropColumn('role_id');
            }
        });

        Schema::dropIfExists('urgency_levels');
        Schema::dropIfExists('case_categories');
        Schema::dropIfExists('roles');
    }
};
