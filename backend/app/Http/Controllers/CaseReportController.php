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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\EvidenceFile;
use Mpdf\Mpdf;

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

        $userRoleName = $user->role ?? $user->role?->name ?? null;
        if ($userRoleName === 'student') {
            $caseReports = CaseReport::with(['reportedByUser', 'affectedStudent', 'permissionRequestRecord', 'latestFinding', 'evidenceFiles'])
            ->where(function ($query) use ($user) {
                $query->where('affected_student_id', $user->id)
                    ->orWhere('reported_by_user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();
        } else {
            $caseReports = CaseReport::with(['reportedByUser', 'affectedStudent', 'permissionRequestRecord', 'latestFinding', 'evidenceFiles'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($caseReports);
    }

    public function store(Request $request)
    {
        // Accept form-data (files + fields)
        $data = $request->all();

        // Validate file inputs (allowed types and size limits)
        $request->validate([
            'evidence_files.*' => 'file|mimes:pdf,doc,docx,jpg,jpeg,png,gif,zip,rar|max:10240', // max 10MB per file
        ]);

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

        // Handle file uploads: store on disk and queue metadata for DB creation
        $pendingUploads = [];
        if ($request->hasFile('evidence_files')) {
            // ensure storage dir exists
            if (! Storage::disk('public')->exists('evidence')) {
                Storage::disk('public')->makeDirectory('evidence');
            }

            foreach ($request->file('evidence_files') as $file) {
                if (! $file->isValid()) continue;

                $uuid = (string) Str::uuid();
                $storedName = $uuid . '-' . preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
                $path = $file->storeAs('evidence', $storedName, 'public');

                $pendingUploads[] = [
                    'original_file_name' => $file->getClientOriginalName(),
                    'stored_file_name' => $storedName,
                    'file_path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'uploaded_by' => $request->user()?->id ?? null,
                ];
            }
        }

        // Attach authenticated reporter if available (use new key)
        $authenticatedUser = $request->user() ?? Auth::guard('sanctum')->user();
        if ($authenticatedUser && empty($processed['reported_by_user_id'])) {
            $processed['reported_by_user_id'] = $authenticatedUser->id;
        }

        // Map legacy student/user fields if present in processed data
        if (isset($processed['student_id']) && empty($processed['affected_student_id'])) {
            $processed['affected_student_id'] = $processed['student_id'];
            unset($processed['student_id']);
        }
        if (isset($processed['user_id']) && empty($processed['reported_by_user_id'])) {
            $processed['reported_by_user_id'] = $processed['user_id'];
            unset($processed['user_id']);
        }

        // Create case report
        $case = CaseReport::create($processed);

        // Persist any pending uploaded files to DB linking to the created case
        if (! empty($pendingUploads)) {
            foreach ($pendingUploads as $p) {
                $p['case_id'] = $case->id;
                $p['reference_type'] = 'case_report';
                $p['reference_id'] = $case->id;
                EvidenceFile::create($p);
            }
        }

        // Backfill student display fields from authenticated user or student relationship
        if ($case->affected_student_id) {
            $student = \App\Models\User::find($case->affected_student_id);
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

    public function export(Request $request)
    {
        $user = $request->user();
        $roleName = $this->resolveUserRole($user);

        if (! $user || $roleName === 'student') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $allowedTypes = $this->allowedExportTypesForRole($roleName);
        if (empty($allowedTypes)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $type = strtolower((string) $request->query('type', 'default'));
        if ($type === 'default') {
            $type = $this->defaultExportTypeForRole($roleName);
        }

        if (! in_array($type, $allowedTypes, true)) {
            return response()->json(['message' => 'Export type not permitted for your role'], 403);
        }

        $startDate = (string) $request->query('startDate', '');
        $endDate = (string) $request->query('endDate', '');
        $category = (string) $request->query('category', 'all');
        $format = strtolower((string) $request->query('format', 'html'));
        if (! in_array($format, ['html', 'pdf'], true)) {
            $format = 'html';
        }

        $query = CaseReport::query()->orderBy('created_at', 'desc');

        // Filter by date range
        if ($startDate !== '' && $endDate !== '') {
            try {
                $start = \Carbon\Carbon::parse($startDate)->startOfDay();
                $end = \Carbon\Carbon::parse($endDate)->endOfDay();
                $query->whereBetween('created_at', [$start, $end]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Invalid date format. Use YYYY-MM-DD.'], 400);
            }
        }

        if ($category !== '' && $category !== 'all') {
            $query->where('category', $category);
        }

        $reports = $query->get();
        $dateRangeLabel = ($startDate && $endDate) ? "{$startDate}_to_{$endDate}" : 'all';
        $filename = 'carebridge-report-' . $dateRangeLabel . ($type !== 'all' ? '-' . $type : '') . ($category !== '' && $category !== 'all' ? '-' . $category : '') . ($format === 'pdf' ? '.pdf' : '.html');

        if ($format === 'pdf') {
            $content = $this->buildPdfReport($reports, $startDate, $endDate, $category, $type);

            return response($content, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        }

        $content = $this->buildHtmlReport($reports, $startDate, $endDate, $category, $type);

        return response($content, 200)
            ->header('Content-Type', 'text/html; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    protected function resolveUserRole($user): string
    {
        if (! $user) {
            return '';
        }

        $roleName = '';
        if (is_string($user->role) && $user->role !== '') {
            $roleName = $user->role;
        } elseif (is_object($user->role) && isset($user->role->name)) {
            $roleName = $user->role->name;
        }

        $roleName = strtolower(trim((string) $roleName));

        return $this->normalizeRoleName($roleName);
    }

    protected function normalizeRoleName(string $role): string
    {
        return match ($role) {
            'admin', 'system_administrator', 'system administrator', 'system_admin', 'administrator' => 'system_administrator',
            'iic', 'iic_secretary', 'iic secretary' => 'iic',
            'disciplinary_committee', 'disciplinary committee', 'disciplinary', 'committee' => 'disciplinary_committee',
            'registrar' => 'registrar',
            'student' => 'student',
            default => $role,
        };
    }

    protected function allowedExportTypesForRole(string $role): array
    {
        return match ($role) {
            'iic' => ['detailed_case_report', 'investigation_report', 'case_progress_report', 'referral_report'],
            'registrar' => ['case_statistics', 'resolution_status_report', 'compliance_report', 'disciplinary_outcome_report'],
            'system_administrator' => ['user_activity_report', 'audit_log_report', 'system_usage_report', 'security_monitoring_report', 'system_admin_case_details'],
            'disciplinary_committee' => ['case_report', 'investigation_summary', 'evidence_report', 'final_decision_report'],
            default => [],
        };
    }

    protected function defaultExportTypeForRole(string $role): string
    {
        return match ($role) {
            'iic' => 'detailed_case_report',
            'registrar' => 'case_statistics',
            'system_administrator' => 'user_activity_report',
            'disciplinary_committee' => 'case_report',
            default => 'case_report',
        };
    }

protected function buildHtmlReport($reports, string $startDate, string $endDate, string $category, string $type): string
    {
        $title = 'CareBridge Report';
        $generatedAt = now()->format('Y-m-d H:i:s');
        $summary = 'Total reports: ' . count($reports);
        $dateRangeLabel = ($startDate && $endDate)
            ? "From " . \Carbon\Carbon::parse($startDate)->format('M d, Y') . " to " . \Carbon\Carbon::parse($endDate)->format('M d, Y')
            : 'All dates';
        $categoryLabel = $category !== '' && $category !== 'all' ? $category : 'All categories';
        $typeLabel = ucfirst(str_replace('_', ' ', $type));

        $rows = '';
        foreach ($reports as $report) {
            $rows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                e($report->ticket_number ?? $report->id),
                e($report->category ?? 'general'),
                e($report->status ?? 'unknown'),
                e($report->urgency_level ?? 'normal'),
                e($report->created_at ? $report->created_at->format('Y-m-d H:i') : 'n/a'),
                e($report->subject ?? 'No subject')
            );
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{$title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #1f2937;
      margin: 20px;
      background: white;
    }
    h1 {
      margin-bottom: 8px;
      color: #111827;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8px;
    }
    .meta {
      color: #4b5563;
      margin: 4px 0;
      font-size: 13px;
    }
    .meta-section {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 10px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background: #3b82f6;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    tr:hover {
      background: #eff6ff;
    }
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #d1d5db;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <h1>{$title}</h1>
  <div class="meta-section">
    <div class="meta"><strong>Report Type:</strong> {$typeLabel}</div>
    <div class="meta"><strong>Generated:</strong> {$generatedAt}</div>
    <div class="meta"><strong>Date Range:</strong> {$dateRangeLabel}</div>
    <div class="meta"><strong>Category:</strong> {$categoryLabel}</div>
    <div class="meta"><strong>{$summary}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ticket #</th>
        <th>Category</th>
        <th>Status</th>
        <th>Urgency</th>
        <th>Date</th>
        <th>Subject</th>
      </tr>
    </thead>
    <tbody>
      {$rows}
    </tbody>
  </table>

  <div class="footer">
    <p>This is an automatically generated report from CareBridge. Please keep this document confidential.</p>
  </div>
</body>
</html>
HTML;
    }

protected function buildPdfReport($reports, string $startDate, string $endDate, string $category, string $type): string
    {
        $html = $this->buildHtmlReport($reports, $startDate, $endDate, $category, $type);

        try {
            $mpdf = new Mpdf([
                'mode' => 'utf-8',
                'format' => 'A4',
                'margin_left' => 10,
                'margin_right' => 10,
                'margin_top' => 10,
                'margin_bottom' => 10,
            ]);

            $mpdf->WriteHTML($html);
            return $mpdf->Output('', 'S'); // 'S' returns the PDF as a string
        } catch (\Exception $e) {
            \Log::error('PDF generation failed: ' . $e->getMessage());
            throw new \Exception('Failed to generate PDF report: ' . $e->getMessage());
        }
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
