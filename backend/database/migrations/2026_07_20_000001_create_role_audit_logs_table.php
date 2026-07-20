<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('role_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('role_name');
            $table->string('action');
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_type')->nullable();
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->text('details')->nullable();
            $table->timestamp('changed_at')->nullable();
            $table->timestamps();

            $table->foreign('changed_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['role_name', 'action', 'changed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_audit_logs');
    }
};
