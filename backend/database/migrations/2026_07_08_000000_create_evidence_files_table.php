<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the `evidence_files` table then attempts to migrate any
     * existing entries from the `case_reports.evidence_files` JSON column.
     * After migrating, the old column is dropped.
     */
    public function up(): void
    {
        Schema::create('evidence_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('case_id')->index()->nullable();
            $table->string('original_file_name');
            $table->string('stored_file_name')->unique();
            $table->string('file_path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->timestamps();
        });

        // Attempt migration of existing JSON stored evidence files
        if (Schema::hasColumn('case_reports', 'evidence_files')) {
            $reports = DB::table('case_reports')->select('id', 'evidence_files')->whereNotNull('evidence_files')->get();
            foreach ($reports as $r) {
                $list = json_decode($r->evidence_files, true);
                if (! is_array($list)) continue;
                foreach ($list as $item) {
                    $oldPath = $item['path'] ?? $item['path'] ?? null;
                    $originalName = $item['name'] ?? $item['original_name'] ?? null;
                    $mime = $item['mime'] ?? null;
                    $size = isset($item['size']) ? (int) $item['size'] : null;

                    $newPath = null;
                    if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                        $newName = (string) Str::uuid() . '-' . basename($oldPath);
                        $newPath = 'evidence/' . $newName;
                        Storage::disk('public')->move($oldPath, $newPath);
                    } else {
                        // try common legacy folder
                        $legacy = 'case_evidence/' . basename($oldPath ?? '');
                        if (Storage::disk('public')->exists($legacy)) {
                            $newName = (string) Str::uuid() . '-' . basename($legacy);
                            $newPath = 'evidence/' . $newName;
                            Storage::disk('public')->move($legacy, $newPath);
                        }
                    }

                    if ($newPath) {
                        DB::table('evidence_files')->insert([
                            'case_id' => $r->id,
                            'original_file_name' => $originalName ?? basename($newPath),
                            'stored_file_name' => basename($newPath),
                            'file_path' => $newPath,
                            'mime_type' => $mime,
                            'file_size' => $size,
                            'uploaded_by' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // drop the old evidence_files column
            Schema::table('case_reports', function (Blueprint $table) {
                if (Schema::hasColumn('case_reports', 'evidence_files')) {
                    $table->dropColumn('evidence_files');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't attempt to restore the old JSON column contents.
        Schema::dropIfExists('evidence_files');
    }
};
