<?php

namespace App\Http\Controllers;

use App\Models\CounselorSchedule;
use App\Models\User;
use Illuminate\Http\Request;

class CounselorScheduleController extends Controller
{
    public function index()
    {
        return response()->json(CounselorSchedule::with('counselor')->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'counselor_id' => 'required|integer|exists:users,id',
            'week_start_date' => 'required|date',
            'week_end_date' => 'required|date',
            'available_slots' => 'nullable|array',
        ]);

        $schedule = CounselorSchedule::create($data);
        $this->markScheduleSetup($data['counselor_id']);

        return response()->json($schedule->load('counselor'), 201);
    }

    public function show($id)
    {
        return response()->json(CounselorSchedule::with('counselor')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'counselor_id' => 'sometimes|required|integer|exists:users,id',
            'week_start_date' => 'sometimes|required|date',
            'week_end_date' => 'sometimes|required|date',
            'available_slots' => 'nullable|array',
        ]);

        $schedule = CounselorSchedule::findOrFail($id);
        $schedule->update($data);
        $this->markScheduleSetup($schedule->counselor_id);

        return response()->json($schedule->load('counselor'));
    }

    public function destroy($id)
    {
        CounselorSchedule::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function markScheduleSetup(int $counselorId): void
    {
        User::where('id', $counselorId)
            ->whereNull('schedule_setup_at')
            ->update(['schedule_setup_at' => now()]);
    }
}
