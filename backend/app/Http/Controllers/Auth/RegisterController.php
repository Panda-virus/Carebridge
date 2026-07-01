<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    /**
     * Register a new student (role forced to 'student').
     */
    public function register(Request $request)
    {
        $data = $request->only(['name', 'email', 'phone', 'location', 'password', 'password_confirmation', 'has_ongoing_case', 'gender', 'program', 'level']);

        foreach ($data as $k => $v) {
            if (is_null($v)) {
                continue;
            }

            if (is_string($v)) {
                $s = preg_replace('/[\x00-\x1F\x7F]+/u', '', $v);
                $s = preg_replace('/(\-\-|\/\*|\*\/|;)/', '', $s);
                $data[$k] = trim($s);
                continue;
            }

            $data[$k] = $v;
        }

        $data['email'] = strtolower($data['email'] ?? '');

        if (User::whereRaw('LOWER(email) = ?', [$data['email']])->exists()) {
            return response()->json([
                'message' => 'An account already exists with this email. Please sign in instead.',
                'code' => 'email_already_registered',
                'errors' => [
                    'email' => ['An account already exists with this email. Please sign in instead.'],
                ],
            ], 422);
        }

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z]+(\s[A-Za-z]+)+$/i'],
            'email' => [
                'required', 'string', 'max:255',
                'regex:/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/',
                Rule::unique('users', 'email'),
            ],
            'phone' => ['required', 'regex:/^[0-9]{10}$/', Rule::unique('users', 'phone')],
            'location' => ['required', 'in:oncampus,offcampus'],
            'gender' => ['required', 'in:male,female'],
            'program' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:255'],
            'has_ongoing_case' => ['present', 'boolean'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'name.regex' => 'Name must consist of letters and spaces only, with first and surname separated into separate fields.',
            'email.regex' => 'Email must be a valid email address.',
            'email.unique' => 'An account already exists with this email. Please sign in instead.',
            'phone.regex' => 'Phone must be exactly 10 digits.',
            'phone.unique' => 'An account already exists with this phone number. Please sign in instead.',
            'password.confirmed' => 'Password and confirm password must match.',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            $message = 'Registration failed. Please review your input.';

            if (isset($errors['name'])) {
                $errors['firstName'] = $errors['name'];
                $errors['surname'] = $errors['name'];
            }

            if (isset($errors['email'])) {
                $message = 'An account already exists with this email. Please sign in instead.';
            } elseif (isset($errors['phone']) && count($errors['phone']) === 1 && str_contains($errors['phone'][0], 'exactly 10 digits')) {
                $message = 'Phone number must be exactly 10 digits.';
            } elseif (isset($errors['password'])) {
                $message = $errors['password'][0];
            }

            return response()->json([
                'errors' => $errors,
                'message' => $message,
                'code' => isset($errors['email']) ? 'email_already_registered' : 'validation_failed',
            ], 422);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'location' => $data['location'],
            'gender' => $data['gender'] ?? null,
            'program' => $data['program'] ?? null,
            'level' => $data['level'] ?? null,
            'has_ongoing_case' => $data['has_ongoing_case'],
            'role' => 'student',
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);

        NotificationService::notifyWelcomeUser($user);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }
}
