<?php

namespace App\Http\Controllers;

use App\Models\CounselingRequest;
use App\Models\CounselingSession;
use App\Models\ExternalCounselor;
use App\Services\AppointmentSchedulingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class CounselingSessionLogController extends Controller
{
    public function __construct(private AppointmentSchedulingService $scheduler)
    {
    }

    public function logSession(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);

        $data = $request->validate([
            'notes' => 'required|string',
            'score' => 'required|integer|min:0|max:100',
            'completed_sessions' => 'required|integer|min:1',
        ]);

        $sessionNumber = $data['completed_sessions'];
        $scores = $req->session_scores ?? [];
        $scores[] = $data['score'];
        $notes = $req->session_notes ?? [];
        $notes[] = "[Score: {$data['score']}/100] {$data['notes']}";

        CounselingSession::create([
            'request_id' => $req->id,
            'session_number' => $sessionNumber,
            'date' => now()->toDateString(),
            'notes' => $data['notes'],
            'score' => $data['score'],
            'completed' => true,
        ]);

        $overall = round(array_sum($scores) / count($scores), 2);

        $req->update([
            'session_scores' => $scores,
            'session_notes' => $notes,
            'overall_score' => $overall,
            'completed_sessions' => $data['completed_sessions'],
            'status' => 'in_progress',
        ]);

        $req->refresh();

        $shouldScheduleNext = ($req->total_sessions ? $data['completed_sessions'] < $req->total_sessions : true)
            && ! empty($req->counselor_id);

        if ($shouldScheduleNext) {
            $nextSlot = $this->scheduler->scheduleNextSession($req);
            if ($nextSlot) {
                $req->update([
                    'scheduled_date' => $nextSlot['date'],
                    'scheduled_time' => $nextSlot['time'],
                ]);
                $req->refresh();
            }
        }

        if ($req->total_sessions && $data['completed_sessions'] >= $req->total_sessions) {
            if ($overall < NotificationService::SCORE_REFERRAL_THRESHOLD) {
                $external = ExternalCounselor::whereNotNull('email')->first();
                if ($external) {
                    $reason = "Auto-referred: overall session score ({$overall}/100) is below the threshold of "
                        . NotificationService::SCORE_REFERRAL_THRESHOLD . '.';
                    $req->update([
                        'status' => 'referred',
                        'external_counselor_id' => $external->id,
                        'referral_reason' => $reason,
                    ]);
                    $req->refresh();
                    NotificationService::notifyExternalReferral($req, $external, $reason);
                }
            }
        }

        return response()->json($req->load(['student', 'counselor', 'externalCounselor', 'sessions']));
    }

    public function addExternalRecord(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);

        $data = $request->validate([
            'notes' => 'required|string',
            'session_number' => 'sometimes|integer|min:1',
        ]);

        $records = $req->external_session_records ?? [];
        $records[] = [
            'session_number' => $data['session_number'] ?? count($records) + 1,
            'notes' => $data['notes'],
            'recorded_at' => now()->toIso8601String(),
            'recorded_by' => $request->user()?->name,
        ];

        $req->update(['external_session_records' => $records]);

        return response()->json($req->load(['student', 'counselor', 'externalCounselor']));
    }
}
