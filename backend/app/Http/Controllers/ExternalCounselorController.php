<?php

namespace App\Http\Controllers;

use App\Models\ExternalCounselor;
use Illuminate\Http\Request;

class ExternalCounselorController extends Controller
{
    public function index()
    {
        return response()->json(ExternalCounselor::latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'nullable|email',
            'phone' => 'sometimes|nullable|string',
            'organization' => 'sometimes|nullable|string',
            'added_by' => 'sometimes|nullable|integer|exists:users,id',
            'notes' => 'sometimes|nullable|string',
        ]);

        $c = ExternalCounselor::create($data);
        return response()->json($c, 201);
    }

    public function show($id)
    {
        return response()->json(ExternalCounselor::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $c = ExternalCounselor::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string',
            'email' => 'sometimes|nullable|email',
            'phone' => 'sometimes|nullable|string',
            'organization' => 'sometimes|nullable|string',
            'added_by' => 'sometimes|nullable|integer|exists:users,id',
            'notes' => 'sometimes|nullable|string',
        ]);
        $c->update($data);
        return response()->json($c);
    }

    public function destroy($id)
    {
        ExternalCounselor::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
