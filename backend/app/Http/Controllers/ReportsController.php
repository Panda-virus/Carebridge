<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CounselingRequest;
use App\Models\CounselingSession;
use App\Models\CaseReport;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReportsController extends Controller
{
    // Counseling progress report
    public function counselingProgress(Request $request)
    {
        $query = CounselingRequest::with(['student', 'counselor', 'sessions'])->latest();

        // Optional filters: counselor_id, from, to
        if ($request->filled('counselor_id')) {
            $query->where('counselor_id', $request->input('counselor_id'));
        }

        $requests = $query->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'student' => [
                    'id' => $r->student?->id,
                    'name' => $r->student?->name,
                    'email' => $r->student?->email,
                ],
                'concern' => $r->concern,
                'status' => $r->status,
                'created_at' => $r->created_at,
                'sessions' => $r->sessions->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'counselor_id' => $s->counselor_id,
                        'scheduled_at' => $s->scheduled_at ?? $s->created_at,
                        'status' => $s->status ?? 'completed',
                        'notes' => $s->notes ?? null,
                    ];
                }),
                'progress' => [
                    'total_sessions' => $r->total_sessions ?? null,
                    'completed_sessions' => $r->completed_sessions ?? 0,
                    'progress_percent' => $r->total_sessions ? (int)round((($r->completed_sessions ?? 0) / $r->total_sessions) * 100) : null,
                ],
                'outcome' => $r->outcome ?? null,
            ];
        });

        return response()->json($requests);
    }

    // Appointment report
    public function appointments(Request $request)
    {
        $query = CounselingSession::with(['request', 'counselor'])->latest();

        if ($request->filled('from')) {
            $query->where('scheduled_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->where('scheduled_at', '<=', $request->input('to'));
        }

        $sessions = $query->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'request_id' => $s->request_id,
                'student' => [
                    'id' => $s->request?->student?->id,
                    'name' => $s->request?->student?->name,
                ],
                'counselor' => [
                    'id' => $s->counselor_id,
                    'name' => $s->counselor?->name ?? null,
                ],
                'scheduled_at' => $s->scheduled_at,
                'status' => $s->status ?? 'scheduled',
                'notes' => $s->notes ?? null,
            ];
        });

        return response()->json($sessions);
    }

    // Case management report
    public function cases(Request $request)
    {
        $query = CaseReport::with(['affectedStudent', 'reportedByUser', 'latestFinding'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $cases = $query->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'subject' => $c->subject,
                'category' => $c->category,
                'affected_student' => [
                    'id' => $c->affectedStudent?->id,
                    'name' => $c->affectedStudent?->name,
                ],
                'reported_by' => [
                    'id' => $c->reported_by_user_id,
                    'name' => $c->reportedByUser?->name,
                ],
                'assigned_authority' => $c->assigned_authority ?? null,
                'investigation_status' => $c->investigation_status ?? null,
                'resolution_status' => $c->resolution_status ?? null,
                'created_at' => $c->created_at,
            ];
        });

        return response()->json($cases);
    }

    // Users / Audit report - simple access log using DB table `access_logs` if exists, otherwise list users and last activity
    public function users(Request $request)
    {
        // If there is an access_logs table, return it
        if (\Schema::hasTable('access_logs')) {
            $logs = DB::table('access_logs')->orderBy('created_at', 'desc')->limit(1000)->get();
            return response()->json($logs);
        }

        // Fallback: return users with basic metadata and last_login if available
        $users = User::select('id', 'name', 'email', 'role', 'last_login_at', 'created_at')->orderBy('last_login_at', 'desc')->get();
        return response()->json($users);
    }

    public function exportUsers(Request $request)
    {
        $user = $request->user();
        if (! $user || strtolower((string) ($user->role ?? '')) !== 'system_administrator') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $format = strtolower((string) $request->query('format', 'html'));
        if (! in_array($format, ['html', 'pdf'], true)) {
            $format = 'html';
        }

        $startDate = (string) $request->query('startDate', '');
        $endDate = (string) $request->query('endDate', '');

        $query = DB::table('access_logs')->select([
            'id',
            'user_id',
            'user_name',
            'user_email',
            'user_role',
            'method',
            'path',
            'ip_address',
            'user_agent',
            'payload',
            'created_at',
        ])->orderBy('created_at', 'desc');

        if ($startDate !== '' && $endDate !== '') {
            try {
                $start = \Carbon\Carbon::parse($startDate)->startOfDay();
                $end = \Carbon\Carbon::parse($endDate)->endOfDay();
                $query->whereBetween('created_at', [$start, $end]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Invalid date format. Use YYYY-MM-DD.'], 400);
            }
        }

        $logs = $query->get();
        $dateRangeLabel = ($startDate && $endDate) ? "{$startDate}_to_{$endDate}" : 'all';
        $filename = 'carebridge-user-activity-report-' . $dateRangeLabel . ($format === 'pdf' ? '.pdf' : '.html');

        if ($format === 'pdf') {
            $html = $this->buildUserActivityHtml($logs, $startDate, $endDate);
            $mpdf = new \Mpdf\Mpdf();
            $mpdf->WriteHTML($html);
            $content = $mpdf->Output('', 'S');

            return response($content, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        }

        $content = $this->buildUserActivityHtml($logs, $startDate, $endDate);

        return response($content, 200)
            ->header('Content-Type', 'text/html; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    protected function buildUserActivityHtml($logs, string $startDate, string $endDate): string
    {
        $rows = '';
        foreach ($logs as $log) {
            $payload = is_string($log->payload) ? json_decode($log->payload, true) : $log->payload;
            $payloadText = is_array($payload) ? json_encode($payload, JSON_UNESCAPED_SLASHES) : '';
            $rows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                e($log->created_at ? \Carbon\Carbon::parse($log->created_at)->format('Y-m-d H:i:s') : '-'),
                e($log->user_name ?? $log->user_email ?? '-'),
                e($log->user_email ?? '-'),
                e($log->user_role ?? '-'),
                e($log->method ?? '-'),
                e($log->path ?? '-'),
                e($log->ip_address ?? '-'),
                e($log->user_agent ?? '-'),
                e($payloadText)
            );
        }

        $title = 'CareBridge User Activity Report';
        $generatedAt = now()->format('Y-m-d H:i:s');
        $dateRangeLabel = ($startDate && $endDate)
            ? 'From ' . \Carbon\Carbon::parse($startDate)->format('M d, Y') . ' to ' . \Carbon\Carbon::parse($endDate)->format('M d, Y')
            : 'All dates';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{$title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
    h1 { border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    .meta { color: #4b5563; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>{$title}</h1>
  <p class="meta">Generated: {$generatedAt}</p>
  <p class="meta">Range: {$dateRangeLabel}</p>
  <p class="meta">Total activity entries: {$logs->count()}</p>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>User</th>
        <th>Email</th>
        <th>Role</th>
        <th>Method</th>
        <th>Path</th>
        <th>IP</th>
        <th>User Agent</th>
        <th>Payload</th>
      </tr>
    </thead>
    <tbody>
      {$rows}
    </tbody>
  </table>
</body>
</html>
HTML;
    }
}
