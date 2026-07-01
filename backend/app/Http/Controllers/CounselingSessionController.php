<?php

namespace App\Http\Controllers;

use App\Models\CounselingSession;
use Illuminate\Http\Request;

class CounselingSessionController extends Controller
{
    public function index(Request $request)
    {
        $query = CounselingSession::query()->latest();

        $user = $request->user();
        if ($user && $user->role === 'student') {
            $query->whereHas('request', function ($query) use ($user) {
                $query->where('student_id', $user->id);
            });
        }

        if ($request->query('request_id')) {
            $query->where('request_id', $request->query('request_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'request_id' => 'required|integer|exists:counseling_requests,id',
            'session_number' => 'required|integer',
            'date' => 'required|date',
            'notes' => 'sometimes|nullable|string',
            'completed' => 'sometimes|boolean',
        ]);

        $session = CounselingSession::create(array_merge($data, [
            'completed' => $data['completed'] ?? false,
        ]));
        return response()->json($session, 201);
    }

    public function show($id)
    {
        return response()->json(CounselingSession::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $session = CounselingSession::findOrFail($id);

        $data = $request->validate([
            'request_id' => 'sometimes|integer|exists:counseling_requests,id',
            'session_number' => 'sometimes|integer',
            'date' => 'sometimes|date',
            'notes' => 'sometimes|nullable|string',
            'completed' => 'sometimes|boolean',
        ]);

        $session->update($data);
        return response()->json($session);
    }

    public function destroy($id)
    {
        CounselingSession::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
