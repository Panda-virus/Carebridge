<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserProvisioningService
{
    /**
     * @return array{created: int, skipped: int, errors: array<int, string>}
     */
    public function importFromRows(array $rows, bool $sendWelcome = true): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $normalized = $this->normalizeRow($row);

            $validator = Validator::make($normalized, [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'role' => 'nullable|string|in:student,counselor,dean,iic,registrar,disciplinary_committee,external_counselor',
                'phone' => 'nullable|string|size:10|unique:users,phone',
                'location' => 'nullable|in:oncampus,offcampus',
                'password' => 'nullable|string|min:6',
            ]);

            if ($validator->fails()) {
                $errors[$line] = implode(' ', $validator->errors()->all());
                $skipped++;

                continue;
            }

            $password = $normalized['password'] ?? Str::random(10);

            $user = User::create([
                'name' => $normalized['name'],
                'email' => strtolower(trim($normalized['email'])),
                'role' => $normalized['role'] ?? 'student',
                'phone' => $normalized['phone'] ?? null,
                'location' => $normalized['location'] ?? 'oncampus',
                'has_ongoing_case' => false,
                'is_external' => ($normalized['role'] ?? 'student') === 'external_counselor',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            if ($sendWelcome) {
                NotificationService::notifyWelcomeUser($user, $normalized['password'] ? null : $password);
            }

            $created++;
        }

        return compact('created', 'skipped', 'errors');
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row): array
    {
        $map = [
            'name' => ['name', 'full_name', 'fullname'],
            'email' => ['email', 'email_address'],
            'role' => ['role', 'user_role'],
            'phone' => ['phone', 'phone_number', 'mobile'],
            'location' => ['location', 'campus'],
            'password' => ['password', 'temp_password'],
        ];

        $normalized = [];
        foreach ($map as $field => $aliases) {
            foreach ($aliases as $alias) {
                if (isset($row[$alias]) && $row[$alias] !== '') {
                    $normalized[$field] = trim((string) $row[$alias]);
                    break;
                }
            }
        }

        return $normalized;
    }
}
