<?php

namespace App\Http\Controllers;

use App\Models\CaseReport;
use App\Services\GbvTriageService;
use App\Services\CaseTimelineService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class CaseReportController extends Controller
{
    /**
     * Display a listing of case reports.
     * - Students see only their own reports
     * - Staff roles see all reports
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'student') {
            $caseReports = CaseReport::with(['user', 'student', 'permissionRequestRecord', 'latestFinding'])
                ->where('student_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $caseReports = CaseReport::with(['user', 'student', 'permissionRequestRecord', 'latestFinding'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($caseReports);
    }

    public function store(Request $request)
    {
        // Accept form-data (files + fields)
        $data = $request->all();

        // Prepare for triage
        $triageService = new GbvTriageService();
        $processed = $triageService->triage($data);

        // Allow client to override urgency_level if passed
        if ($request->filled('urgency_level')) {
            $processed['urgency_level'] = $request->input('urgency_level');
        }

        // Handle subject/title - auto-generate from description if not provided
        if ($request->filled('subject')) {
            $processed['subject'] = $request->input('subject');
        } else {
            $description = $processed['description'] ?? '';
            $processed['subject'] = strtok(strip_tags($description), "\n.");
            if (strlen($processed['subject']) > 80) {
                $processed['subject'] = substr($processed['subject'], 0, 77) . '...';
            }
        }

        // Handle file uploads
        $uploaded = [];
        if ($request->hasFile('evidence_files')) {
            foreach ($request->file('evidence_files') as $file) {
                if (! $file->isValid()) continue;
                $path = $file->storePubliclyAs('case_evidence', Str::random(24) . '_' . $file->getClientOriginalName(), 'public');
                $uploaded[] = [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'path' => $path,
                    'url' => asset("storage/{$path}"),
                ];
            }
        }

        if (! empty($uploaded)) {
            $processed['evidence_files'] = json_encode($uploaded);
        }

        // Attach authenticated reporter if available
        if ($request->user() && empty($processed['user_id'])) {
            $processed['user_id'] = $request->user()->id;
        }

        // Create case report
        $case = CaseReport::create($processed);

        // Backfill student display fields from authenticated user or student relationship
        if ($case->student_id) {
            $student = \App\Models\User::find($case->student_id);
            if ($student) {
                $shouldSave = false;
                if (Schema::hasColumn('case_reports', 'student_name') && empty($case->student_name)) {
                    $case->student_name = $student->name;
                    $shouldSave = true;
                }
                if (Schema::hasColumn('case_reports', 'student_email') && empty($case->student_email)) {
                    $case->student_email = $student->email;
                    $shouldSave = true;
                }
                if (Schema::hasColumn('case_reports', 'student_phone') && empty($case->student_phone)) {
                    $case->student_phone = $student->phone ?? null;
                    $shouldSave = true;
                }
                if ($shouldSave) {
                    $case->save();
                }
            }
        }

        // Ticket number is generated automatically by the CaseReport model if missing.

        // Initialize timeline
        try {
            CaseTimelineService::initializeTimeline($case);
        } catch (\Throwable $e) {
            // non-fatal
        }

        // Notify relevant role
        try {
            NotificationService::notifyNewCaseReport($case);
            if (in_array($case->category ?? '', ['sexual_harassment_gbv', 'sexual_assault'], true)
                && in_array($case->urgency_level, ['immediate', 'critical', 'high'], true)) {
                NotificationService::notifyGbvUrgentAlert($case);
            }
        } catch (\Throwable $e) {
            // ignore notification failures
        }

        return response()->json($case->fresh(), 201);
    }

    public function update(Request $request, CaseReport $caseReport)
    {
        $updates = $request->all();
        unset($updates['id']);

        if (isset($updates['response_notes']) && $updates['response_notes'] === '') {
            $updates['response_notes'] = null;
        }

        $caseReport->fill($updates);
        $caseReport->save();

        return response()->json($caseReport->fresh());
    }
}
