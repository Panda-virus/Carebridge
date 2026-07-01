<?php

namespace Database\Seeders;

use App\Models\ExternalCounselor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name' => 'Registrar',
            'email' => 'registrar@mzuni.ac.mw',
            'role' => 'registrar',
            'phone' => '0999000001',
            'location' => 'oncampus',
            'has_ongoing_case' => false,
            'password' => 'registrar01',
        ]);

        User::factory()->create([
            'name' => 'Disciplinary Committee',
            'email' => 'disciplinary@mzuni.ac.mw',
            'role' => 'disciplinary_committee',
            'phone' => '0999000002',
            'location' => 'oncampus',
            'has_ongoing_case' => false,
            'password' => 'disciplinary01',
        ]);

        User::factory()->create([
            'name' => 'University Counselor',
            'email' => 'universitycounsellor@mzuni.ac.mw',
            'role' => 'counselor',
            'phone' => '0999000003',
            'location' => 'oncampus',
            'has_ongoing_case' => false,
            'password' => 'counsellor01',
        ]);

        User::factory()->create([
            'name' => 'Dean of Students',
            'email' => 'deanofstudents@mzuni.ac.mw',
            'role' => 'dean',
            'phone' => '0999000004',
            'location' => 'oncampus',
            'has_ongoing_case' => false,
            'password' => 'deanofstudents01',
        ]);

        User::factory()->create([
            'name' => 'IIC Officer',
            'email' => 'iic@mzuni.ac.mw',
            'role' => 'iic',
            'phone' => '0999000005',
            'location' => 'oncampus',
            'has_ongoing_case' => false,
            'password' => 'iic01',
        ]);

        User::factory()->create([
            'name' => 'Praise Saina',
            'email' => 'student@mzuni.ac.mw',
            'role' => 'student',
            'phone' => '0999000006',
            'location' => 'oncampus',
            'gender' => 'male',
            'program' => 'Bachelor of science in Education Science',
            'level' => '2',
            'has_ongoing_case' => false,
            'password' => 'student01',
        ]);

        User::factory()->create([
            'name' => 'System administrator',
            'email' => 'carebridgeadmin@mzuni.ac.mw',
            'role' => 'admin',
            'phone'=> '0998745644',
            'location' => 'oncampus',
            'has_ongoing_case' => false,
            'password' => 'admin01',
        ]);

        $externalUser = User::factory()->create([
            'name' => 'Dr. Jane External',
            'email' => 'external@mzuni.ac.mw',
            'role' => 'external_counselor',
            'phone' => '0999000007',
            'location' => 'offcampus',
            'has_ongoing_case' => false,
            'is_external' => true,
            'password' => 'external01',
        ]);

        ExternalCounselor::create([
            'user_id' => $externalUser->id,
            'name' => $externalUser->name,
            'email' => $externalUser->email,
            'phone' => $externalUser->phone,
            'organization' => 'St John Of God',
        ]);
    }
}
