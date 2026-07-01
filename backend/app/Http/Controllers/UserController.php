<?php

namespace App\Http\Controllers;

use App\Models\CaseReport;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'role' => 'nullable|string|in:student,counselor,dean,iic,registrar,disciplinary_committee,external_counselor,system_administrator',
            'phone' => ['nullable', 'regex:/^[0-9]{10}$/', Rule::unique('users', 'phone')],
            'location' => 'nullable|in:oncampus,offcampus',
            'has_ongoing_case' => 'nullable|boolean',
            'is_external' => 'nullable|boolean',
            'password' => 'nullable|string|min:6',
            'send_welcome' => 'nullable|boolean',
        ]);

        $data['email'] = strtolower($data['email']);
        $plainPassword = $data['password'] ?? 'password';
        unset($data['password'], $data['send_welcome']);

        $user = User::create(array_merge($data, [
            'password' => Hash::make($plainPassword),
            'email_verified_at' => now(),
            'role' => $data['role'] ?? 'student',
            'is_external' => $data['is_external'] ?? (($data['role'] ?? 'student') === 'external_counselor'),
        ]));

        if ($request->boolean('send_welcome', true)) {
            NotificationService::notifyWelcomeUser(
                $user,
                ($request->input('password') ? null : $plainPassword)
            );
        }

        return response()->json($user, 201);
    }

    public function show($id)
    {
        return response()->json(User::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'regex:/^[0-9]{10}$/', Rule::unique('users', 'phone')->ignore($user->id)],
            'role' => 'sometimes|string|in:student,counselor,dean,iic,registrar,disciplinary_committee,external_counselor,system_administrator',
            'location' => 'sometimes|in:oncampus,offcampus',
            'gender' => 'sometimes|string|nullable',
            'program' => 'sometimes|string|nullable',
            'level' => 'sometimes|string|nullable',
            'emergency_contact' => 'sometimes|string|nullable',
            'has_ongoing_case' => 'sometimes|boolean',
            'is_external' => 'sometimes|boolean',
            'password' => 'sometimes|string|min:6',
        ]);

        if (isset($data['email'])) {
            $data['email'] = strtolower($data['email']);
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        DB::transaction(function () use ($user): void {
            CaseReport::where('student_id', $user->id)->update(['student_id' => null]);
            $user->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }
}
