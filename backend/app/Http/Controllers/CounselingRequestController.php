<?php

namespace App\Http\Controllers;

use App\Models\CounselingRequest;
use App\Models\ExternalCounselor;
use App\Services\AppointmentSchedulingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class CounselingRequestController extends Controller
{
    public function __construct(private readonly AppointmentSchedulingService $scheduler) {}

    public function index(Request $request)
    {
        $query = CounselingRequest::query()->with(['student', 'counselor', 'externalCounselor'])->latest();

        $user = $request->user();
        if ($user && $user->role === 'student') {
            $query->where(function ($q) use ($user) {
                $q->where('student_id', $user->id)
                    ->orWhereHas('student', function ($studentQuery) use ($user) {
                        $studentQuery->where('id', $user->id);
                    });
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|integer|exists:users,id',
            'concern' => 'required|string',
            'category' => 'nullable|string',
            'urgency_level' => 'nullable|string',
            'preferred_time' => 'nullable|string',
            'status' => 'nullable|string',
            'requires_immediate_attention' => 'nullable|boolean',
            'matched_keywords' => 'nullable|array',
            'proposed_date' => 'nullable|date',
            'proposed_time' => 'nullable|string',
            'student_approved' => 'nullable|boolean',
            'counselor_approved' => 'nullable|boolean',
            'counselor_id' => 'nullable|integer|exists:users,id',
            'scheduled_date' => 'nullable|date',
            'scheduled_time' => 'nullable|string',
            'total_sessions' => 'nullable|integer',
            'completed_sessions' => 'nullable|integer',
            'session_notes' => 'nullable|array',
            'recommendations' => 'nullable|string',
            'referral_reason' => 'nullable|string',
            'external_counselor_id' => 'nullable|integer|exists:external_counselors,id',
            'auto_schedule' => 'nullable|boolean',
        ]);

        $autoSchedule = $data['auto_schedule'] ?? true;
        unset($data['auto_schedule']);

        if ($autoSchedule) {
            $data = $this->scheduler->autoSchedule($data);
        }

        $req = CounselingRequest::create(array_merge($data, [
            'status' => $data['status'] ?? 'pending_review',
        ]));

        $req->load(['student', 'counselor', 'externalCounselor']);

        if ($req->proposed_date && $req->proposed_time) {
            NotificationService::notifyAppointmentProposal($req);
        }

        return response()->json($req, 201);
    }

    public function show($id)
    {
        return response()->json(
            CounselingRequest::with(['student', 'counselor', 'externalCounselor'])->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);

        $data = $request->validate([
            'student_id' => 'sometimes|integer|exists:users,id',
            'concern' => 'sometimes|string',
            'category' => 'sometimes|nullable|string',
            'urgency_level' => 'sometimes|string',
            'preferred_time' => 'sometimes|nullable|string',
            'status' => 'sometimes|string|in:pending_review,pending_approval,student_approved,counselor_approved,approval_rejected,scheduled,in_progress,completed,rejected,referred',
            'requires_immediate_attention' => 'sometimes|boolean',
            'matched_keywords' => 'sometimes|nullable|array',
            'proposed_date' => 'sometimes|nullable|date',
            'proposed_time' => 'sometimes|nullable|string',
            'student_approved' => 'sometimes|boolean',
            'counselor_approved' => 'sometimes|boolean',
            'student_rejected_at' => 'sometimes|nullable|date',
            'counselor_rejected_at' => 'sometimes|nullable|date',
            'counselor_id' => 'sometimes|nullable|integer|exists:users,id',
            'scheduled_date' => 'sometimes|nullable|date',
            'scheduled_time' => 'sometimes|nullable|string',
            'total_sessions' => 'sometimes|nullable|integer',
            'completed_sessions' => 'sometimes|nullable|integer',
            'session_notes' => 'sometimes|nullable|array',
            'session_scores' => 'sometimes|nullable|array',
            'overall_score' => 'sometimes|nullable|numeric',
            'external_session_records' => 'sometimes|nullable|array',
            'recommendations' => 'sometimes|nullable|string',
            'referral_reason' => 'sometimes|nullable|string',
            'external_counselor_id' => 'sometimes|nullable|integer|exists:external_counselors,id',
        ]);

        if ($request->hasAny(['student_approved', 'counselor_approved'])) {
            $studentApproved = array_key_exists('student_approved', $data) ? $data['student_approved'] : $req->student_approved;
            $counselorApproved = array_key_exists('counselor_approved', $data) ? $data['counselor_approved'] : $req->counselor_approved;

            if ($studentApproved && $counselorApproved) {
                $data['status'] = $data['status'] ?? 'scheduled';
                $data['scheduled_date'] = $data['scheduled_date'] ?? $data['proposed_date'] ?? $req->scheduled_date;
                $data['scheduled_time'] = $data['scheduled_time'] ?? $data['proposed_time'] ?? $req->scheduled_time;
                $data['completed_sessions'] = $data['completed_sessions'] ?? $req->completed_sessions ?? 0;
            } elseif (!isset($data['status'])) {
                $data['status'] = $studentApproved ? 'student_approved' : 'counselor_approved';
            }
        }

        if ($request->hasAny(['student_rejected_at', 'counselor_rejected_at'])) {
            $data['status'] = 'approval_rejected';
        }

        if (isset($data['status']) && $data['status'] === 'scheduled') {
            if (empty($data['scheduled_date']) || empty($data['scheduled_time'])) {
                return response()->json([
                    'message' => 'scheduled_date and scheduled_time are required when marking a request as scheduled.',
                ], 422);
            }
        }

        $req->update($data);
        $req->refresh()->load(['student', 'externalCounselor']);

        if (isset($data['status']) && $data['status'] === 'referred' && $req->external_counselor_id) {
            $external = ExternalCounselor::find($req->external_counselor_id);
            if ($external) {
                NotificationService::notifyExternalReferral(
                    $req,
                    $external,
                    $req->referral_reason ?? 'Referred by university counselor.'
                );
            }
        }

        return response()->json($req->load(['student', 'counselor', 'externalCounselor']));
    }

    public function destroy($id)
    {
        CounselingRequest::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function approve($id)
    {
        $req = CounselingRequest::findOrFail($id);
        $req->status = 'scheduled';
        $req->save();
        return response()->json($req);
    }

    public function sessions($id)
    {
        $req = CounselingRequest::with('sessions')->findOrFail($id);
        return response()->json($req->sessions);
    }

    public function approveStudent(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);
        $req->student_approved = true;
        $req->status = $req->counselor_approved ? 'scheduled' : 'student_approved';

        if ($req->student_approved && $req->counselor_approved && $req->proposed_date && $req->proposed_time) {
            $req->scheduled_date = $req->scheduled_date ?? $req->proposed_date;
            $req->scheduled_time = $req->scheduled_time ?? $req->proposed_time;
            $req->completed_sessions = $req->completed_sessions ?? 0;
        }

        $req->save();
        return response()->json($req);
    }

    public function approveCounselor(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);
        $req->counselor_approved = true;
        $req->status = $req->student_approved ? 'scheduled' : 'counselor_approved';

        if ($req->student_approved && $req->counselor_approved && $req->proposed_date && $req->proposed_time) {
            $req->scheduled_date = $req->scheduled_date ?? $req->proposed_date;
            $req->scheduled_time = $req->scheduled_time ?? $req->proposed_time;
            $req->completed_sessions = $req->completed_sessions ?? 0;
        }

        $req->save();
        return response()->json($req);
    }

    public function rejectApproval(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);

        $data = $request->validate([
            'rejected_by' => 'sometimes|in:student,counselor',
            'student_rejected_at' => 'sometimes|nullable|date',
            'counselor_rejected_at' => 'sometimes|nullable|date',
        ]);

        if (($data['rejected_by'] ?? null) === 'student') {
            $req->student_rejected_at = $data['student_rejected_at'] ?? now();
        } elseif (($data['rejected_by'] ?? null) === 'counselor') {
            $req->counselor_rejected_at = $data['counselor_rejected_at'] ?? now();
        }

        $req->status = 'approval_rejected';
        $req->save();

        return response()->json($req);
    }

    public function schedule(Request $request, $id)
    {
        $req = CounselingRequest::findOrFail($id);

        $data = $request->validate([
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|string',
            'counselor_id' => 'sometimes|nullable|integer|exists:users,id',
            'total_sessions' => 'sometimes|required|integer',
            'completed_sessions' => 'sometimes|nullable|integer',
        ]);

        $req->fill(array_merge($data, [
            'status' => 'scheduled',
            'completed_sessions' => $data['completed_sessions'] ?? 0,
        ]));
        $req->save();

        return response()->json($req);
    }
}
