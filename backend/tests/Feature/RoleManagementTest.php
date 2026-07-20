<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_be_linked_to_roles_via_role_id(): void
    {
        $role = Role::create([
            'name' => 'Student',
            'slug' => 'student',
            'description' => 'Student access',
        ]);

        $user = User::factory()->create([
            'role' => 'student',
            'role_id' => $role->id,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role_id' => $role->id,
        ]);

        $this->assertEquals('student', $user->fresh()->role->slug);
    }
}
