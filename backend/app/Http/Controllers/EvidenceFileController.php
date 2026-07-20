<?php

namespace App\Http\Controllers;

use App\Models\EvidenceFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EvidenceFileController extends Controller
{
    public function download(Request $request, $id)
    {
        $user = $request->user();
        $ef = EvidenceFile::with('caseReport')->findOrFail($id);

        $this->authorize('view', $ef);

        if (! $ef->file_path || ! Storage::disk('public')->exists($ef->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($ef->file_path, $ef->original_file_name ?: basename($ef->file_path));
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $ef = EvidenceFile::with('caseReport')->findOrFail($id);

        $this->authorize('delete', $ef);

        // Remove physical file if exists
        if ($ef->file_path && Storage::disk('public')->exists($ef->file_path)) {
            Storage::disk('public')->delete($ef->file_path);
        }

        $ef->delete();

        return response()->json(['message' => 'Deleted'], 200);
    }
}
