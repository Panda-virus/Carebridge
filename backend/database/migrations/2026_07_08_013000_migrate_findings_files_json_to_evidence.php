<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('case_reports', 'findings_files')) {
            return;
        }

        $reports = DB::table('case_reports')->select('id', 'findings_files')->whereNotNull('findings_files')->get();
        foreach ($reports as $r) {
            $list = json_decode($r->findings_files, true);
            if (! is_array($list)) continue;
            foreach ($list as $item) {
                $path = $item['path'] ?? null;
                $original = $item['name'] ?? $item['original_name'] ?? basename($path ?? 'file');
                $mime = $item['mime'] ?? null;
                $size = isset($item['size']) ? (int) $item['size'] : null;

                // try to move into evidence/ if still in case_evidence/
                $newPath = null;
                if ($path && Storage::disk('public')->exists($path)) {
                    $newName = (string) Str::uuid() . '-' . basename($path);
                    $newPath = 'evidence/' . $newName;
                    Storage::disk('public')->move($path, $newPath);
                }

                DB::table('evidence_files')->insert([
                    'case_id' => $r->id,
                    'original_file_name' => $original,
                    'stored_file_name' => $newPath ? basename($newPath) : ($path ? basename($path) : Str::random(12)),
                    'file_path' => $newPath ?? $path,
                    'mime_type' => $mime,
                    'file_size' => $size,
                    'reference_type' => 'finding',
                    'reference_id' => $r->id,
                    'uploaded_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // drop the findings_files column
        Schema::table('case_reports', function ($table) {
            if (Schema::hasColumn('case_reports', 'findings_files')) {
                $table->dropColumn('findings_files');
            }
        });
    }

    public function down(): void
    {
        // Restoring JSON is not supported automatically
    }
};
