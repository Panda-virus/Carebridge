<?php

namespace App\Http\Controllers;

use App\Models\CasePermissionRequest;
use App\Models\CaseFinding;
use App\Models\CaseReport;
use App\Models\RegistrarCaseFile;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CaseWorkflowController extends Controller
{
    public function requestPermission(Request $request, CaseReport $caseReport)
    {
        if (! $caseReport->exists) {
            $caseReportId = $request->route('caseReport') ?? $request->route('case_report');
            $caseReport = CaseReport::findOrFail($caseReportId);
        }

        $requestText = trim((string) $request->input('permission_request', ''));

        $caseReport->permission_request = $requestText;
        $caseReport->workflow_stage = 'permission_pending';
        $caseReport->save();

        CasePermissionRequest::updateOrCreate(
            ['case_report_id' => $caseReport->id],
            [
                'request_text' => $requestText,
                'status' => 'pending',
                'requested_at' => now(),
                'requested_by' => $request->user()?->id,
            ]
        );

        try {
            NotificationService::notifyPermissionRequest($caseReport);
        } catch (\Throwable $e) {
            // ignore notification failures
        }

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function acknowledge(Request $request, CaseReport $caseReport)
    {
        $caseReport->status = 'acknowledged';
        $caseReport->workflow_stage = 'at_iic';
        $caseReport->reviewed_at = now();
        $caseReport->save();

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function approvePermission(Request $request, CaseReport $caseReport)
    {
        $caseReport->permission_approved_at = now();
        $caseReport->response_notes = $request->input('response_notes');
        $caseReport->workflow_stage = 'permission_approved';
        $caseReport->status = 'ongoing_investigation';
        $caseReport->save();

        CasePermissionRequest::updateOrCreate(
            ['case_report_id' => $caseReport->id],
            [
                'status' => 'approved',
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()?->id,
            ]
        );

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function startInvestigation(Request $request, CaseReport $caseReport)
    {
        $caseReport->response_notes = $request->input('response_notes');
        $caseReport->workflow_stage = 'investigation';
        $caseReport->status = 'ongoing_investigation';
        $caseReport->save();

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function submitFindings(Request $request, CaseReport $caseReport)
    {
        $caseReport->findings_report = $request->input('findings_report');
        $caseReport->workflow_stage = 'findings_with_registrar';
        $caseReport->status = 'findings_under_review';

        $uploaded = [];
        $files = $request->file('findings_files');
        if (empty($files) && $request->hasFile('findings_files[]')) {
            $files = $request->file('findings_files[]');
        }

        if (! empty($files)) {
            foreach ($files as $file) {
                if (! $file instanceof \Illuminate\Http\UploadedFile || ! $file->isValid()) {
                    continue;
                }
                $path = $file->storePubliclyAs('case_findings', Str::random(24) . '_' . $file->getClientOriginalName(), 'public');
                $uploaded[] = [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'path' => $path,
                    'url' => url("/api/case-reports/{$caseReport->id}/findings-file?file_path=" . rawurlencode($path) . "&file_name=" . rawurlencode($file->getClientOriginalName())),
                ];
            }
        }

        if (! empty($uploaded)) {
            $caseReport->findings_files = json_encode($uploaded);
        }

        $caseReport->save();

        CaseFinding::create([
            'case_report_id' => $caseReport->id,
            'case_number' => $caseReport->ticket_number ?? $caseReport->id,
            'submitted_by' => $request->user()?->id,
            'findings_report' => $caseReport->findings_report,
            'findings_files' => ! empty($uploaded) ? $uploaded : null,
        ]);

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function downloadFindingFile(Request $request, CaseReport $caseReport)
    {
        $filePath = $request->query('file_path');
        $fileName = $request->query('file_name') ?? basename((string) $filePath);

        if (! $filePath) {
            abort(404);
        }

        $finding = $caseReport->latestFinding;
        if (! $finding || ! is_array($finding->findings_files)) {
            abort(404);
        }

        $allowedPaths = array_column($finding->findings_files, 'path');
        if (! in_array($filePath, $allowedPaths, true)) {
            abort(404);
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($filePath)) {
            abort(404);
        }

        $absolutePath = $disk->path($filePath);

        return response()->file($absolutePath, [
            'Content-Disposition' => 'inline; filename="' . basename((string) $fileName) . '"',
        ]);
    }

    public function forwardToDisciplinary(Request $request, CaseReport $caseReport)
    {
        $reason = trim((string) ($request->input('response_notes') ?? $request->input('reason') ?? ''));

        $caseReport->response_notes = $reason;
        $caseReport->workflow_stage = 'with_disciplinary';
        $caseReport->status = 'referred_to_disciplinary_hearing';
        $caseReport->registrar_action = 'referred';
        $caseReport->registrar_action_reason = $reason;
        $content = $this->generateRegistrarCaseFile($caseReport, 'Referred to Disciplinary Committee', $reason);
        // persist a registrar case file record
        $rcf = RegistrarCaseFile::create([
            'case_report_id' => $caseReport->id,
            'case_number' => $caseReport->ticket_number ?? $caseReport->id,
            'case_title' => $caseReport->subject ?? null,
            'action_label' => 'Referred to Disciplinary Committee',
            'recommendation' => $request->input('response_notes'),
            'description' => $caseReport->description,
            'findings_report' => $caseReport->findings_report ?? $caseReport->latestFinding?->findings_report ?? null,
            'findings_files' => $caseReport->latestFinding?->findings_files ?? $caseReport->findings_files ?? null,
            'content' => $content,
            'created_by' => $request->user()?->id,
        ]);

        $caseReport->registrar_case_file = $content;
        if (Schema::hasColumn($caseReport->getTable(), 'registrar_case_file_id')) {
            $caseReport->registrar_case_file_id = $rcf->id;
        }
        $caseReport->save();

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function dismissCase(Request $request, CaseReport $caseReport)
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $reason = trim((string) ($request->input('reason') ?? $request->input('response_notes') ?? ''));

        $caseReport->response_notes = $reason;
        $caseReport->workflow_stage = 'closed';
        $caseReport->status = 'closed';
        $caseReport->registrar_action = 'dismissed';
        $caseReport->registrar_action_reason = $reason;
        $content = $this->generateRegistrarCaseFile($caseReport, 'Dismissed by Registrar', $reason);
        $rcf = RegistrarCaseFile::create([
            'case_report_id' => $caseReport->id,
            'case_number' => $caseReport->ticket_number ?? $caseReport->id,
            'case_title' => $caseReport->subject ?? null,
            'action_label' => 'Dismissed by Registrar',
            'recommendation' => $request->input('reason'),
            'description' => $caseReport->description,
            'findings_report' => $caseReport->findings_report ?? $caseReport->latestFinding?->findings_report ?? null,
            'findings_files' => $caseReport->latestFinding?->findings_files ?? $caseReport->findings_files ?? null,
            'content' => $content,
            'created_by' => $request->user()?->id,
        ]);

        $caseReport->registrar_case_file = $content;
        if (Schema::hasColumn($caseReport->getTable(), 'registrar_case_file_id')) {
            $caseReport->registrar_case_file_id = $rcf->id;
        }
        $caseReport->save();

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    private function generateRegistrarCaseFile(CaseReport $caseReport, string $actionLabel, ?string $recommendation): string
    {
        $reporterName = $caseReport->user?->name ?? $caseReport->student?->name ?? 'Unknown reporter';
        $caseTitle = $caseReport->subject ?? 'Untitled case';
        $caseNumber = $caseReport->ticket_number ?? $caseReport->id;
        $description = trim((string) $caseReport->description);
        $findingsReport = $caseReport->findings_report ?? $caseReport->latestFinding?->findings_report ?? 'No findings report available.';
        $findingsFiles = $caseReport->latestFinding?->findings_files ?? $caseReport->findings_files ?? [];

        $findingsFileList = 'None';
        if (is_array($findingsFiles) && count($findingsFiles) > 0) {
            $items = array_map(function ($file) {
                return '- ' . ($file['name'] ?? ($file['path'] ?? 'Unnamed file'));
            }, $findingsFiles);
            $findingsFileList = implode("\n", $items);
        }

        return trim(implode("\n\n", [
            "Registrar Case File",
            "Case Number: {$caseNumber}",
            "Case Title: {$caseTitle}",
            "Reporter: {$reporterName}",
            "Action: {$actionLabel}",
            "Recommendation: " . ($recommendation ? trim((string) $recommendation) : 'No additional recommendation provided.'),
            "---",
            "Case Description:",
            $description,
            "---",
            "Findings Report:",
            $findingsReport,
            "---",
            "Attached Findings Documents:",
            $findingsFileList,
        ]));
    }

    public function sendMeetingNotice(Request $request, CaseReport $caseReport)
    {
        $caseReport->meeting_notice = $request->input('meeting_notice');
        $caseReport->meeting_date = $request->input('meeting_date');

        // Handle meeting emails (can be JSON string or array)
        $meetingEmails = $request->input('meeting_emails');
        if (is_string($meetingEmails)) {
            $decoded = json_decode($meetingEmails, true);
            $meetingEmails = is_array($decoded) ? $decoded : [$meetingEmails];
        }
        if (is_array($meetingEmails)) {
            $caseReport->meeting_emails = json_encode(array_values($meetingEmails));
        }

        // Handle meeting files
        $uploaded = [];
        if ($request->hasFile('meeting_files')) {
            foreach ($request->file('meeting_files') as $file) {
                if (! $file->isValid()) continue;
                $path = $file->storePubliclyAs('meeting_notices', Str::random(24) . '_' . $file->getClientOriginalName(), 'public');
                $uploaded[] = [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'path' => $path,
                    'url' => url("/api/case-reports/{$caseReport->id}/meeting-file?file_path=" . rawurlencode($path) . "&file_name=" . rawurlencode($file->getClientOriginalName())),
                ];
            }
        }
        if (! empty($uploaded)) {
            $caseReport->meeting_files = json_encode($uploaded);
        }

        $caseReport->workflow_stage = 'meeting_notice_sent';
        $caseReport->status = 'awaiting_disciplinary_hearing';
        $caseReport->save();

        // Send email notifications to provided recipients
        try {
            if (is_array($meetingEmails)) {
                foreach ($meetingEmails as $to) {
                    $body = "You have been invited to a disciplinary meeting for case: " . ($caseReport->ticket_number ?? $caseReport->id) . "\n\n" . ($caseReport->meeting_notice ?? '') . "\n\n";
                    if (! empty($uploaded)) {
                        foreach ($uploaded as $f) {
                            $body .= "Document: " . ($f['url'] ?? '') . "\n";
                        }
                    }
                    NotificationService::sendEmail($to, 'Meeting Notice: CareBridge', $body, 'Meeting Notice');
                }
            }
        } catch (\Throwable $e) {
            // ignore notification failures
        }

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function recordVerdict(Request $request, CaseReport $caseReport)
    {
        $caseReport->verdict = $request->input('verdict');

        // Handle verdict emails
        $verdictEmails = $request->input('verdict_emails');
        if (is_string($verdictEmails)) {
            $decoded = json_decode($verdictEmails, true);
            $verdictEmails = is_array($decoded) ? $decoded : [$verdictEmails];
        }
        if (is_array($verdictEmails)) {
            $caseReport->verdict_emails = json_encode(array_values($verdictEmails));
        }

        // Handle verdict files
        $uploaded = [];
        if ($request->hasFile('verdict_files')) {
            foreach ($request->file('verdict_files') as $file) {
                if (! $file->isValid()) continue;
                $path = $file->storePubliclyAs('verdicts', Str::random(24) . '_' . $file->getClientOriginalName(), 'public');
                $uploaded[] = [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'path' => $path,
                    'url' => url("/api/case-reports/{$caseReport->id}/verdict-file?file_path=" . rawurlencode($path) . "&file_name=" . rawurlencode($file->getClientOriginalName())),
                ];
            }
        }
        if (! empty($uploaded)) {
            $caseReport->verdict_files = json_encode($uploaded);
        }

        $caseReport->workflow_stage = 'closed';
        $caseReport->status = 'verdict_served';
        $caseReport->save();

        // Notify recipients with verdict
        try {
            if (is_array($verdictEmails)) {
                foreach ($verdictEmails as $to) {
                    $body = "A verdict has been recorded for case: " . ($caseReport->ticket_number ?? $caseReport->id) . "\n\n" . ($caseReport->verdict ?? '') . "\n\n";
                    if (! empty($uploaded)) {
                        foreach ($uploaded as $f) {
                            $body .= "Document: " . ($f['url'] ?? '') . "\n";
                        }
                    }
                    NotificationService::sendEmail($to, 'Case Verdict: CareBridge', $body, 'Case Verdict');
                }
            }
        } catch (\Throwable $e) {
            // ignore notification failures
        }

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }

    public function approveVerdict(Request $request, CaseReport $caseReport)
    {
        $request->validate([
            'emails' => ['sometimes'],
        ]);

        $emails = $request->input('emails');
        if (is_string($emails)) {
            $decoded = json_decode($emails, true);
            $emails = is_array($decoded) ? $decoded : [$emails];
        }

        $caseReport->registrar_action = 'verdict_approved';
        $caseReport->save();

        try {
            if (is_array($emails)) {
                foreach ($emails as $to) {
                    $body = "The verdict for case: " . ($caseReport->ticket_number ?? $caseReport->id) . " has been approved by the registrar.\n\n" . ($caseReport->verdict ?? '');
                    NotificationService::sendEmail($to, 'Verdict Approved: CareBridge', $body, 'Verdict Approved');
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json($caseReport->fresh(['user', 'student', 'permissionRequestRecord', 'latestFinding']));
    }
}
