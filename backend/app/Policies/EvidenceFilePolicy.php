<?php

namespace App\Policies;

use App\Models\EvidenceFile;
use App\Models\User;

class EvidenceFilePolicy
{
    /**
     * Determine whether the user can view/download the evidence file.
     */
    public function view(User $user, EvidenceFile $ef): bool
    {
        $allowedRoles = ['counselor', 'iic', 'registrar', 'administrator'];

        // Role can be a string (legacy) or relation (Role model)
        $roleName = null;
        if (is_string($user->role)) {
            $roleName = $user->role;
        } elseif (is_object($user->role) && isset($user->role->name)) {
            $roleName = $user->role->name;
        }

        // uploader can always access
        if ($ef->uploaded_by && $user->id === $ef->uploaded_by) {
            return true;
        }

        // students can access if they are the affected student on the related case
        if ($roleName === 'student') {
            if ($ef->caseReport && $ef->caseReport->affected_student_id === $user->id) {
                return true;
            }
            return false;
        }

        // staff roles
        if (in_array($roleName, $allowedRoles, true)) {
            return true;
        }

        return false;
    }

    /**
     * Alias for view/download
     */
    public function download(User $user, EvidenceFile $ef): bool
    {
        return $this->view($user, $ef);
    }

    /**
     * Determine whether the user can delete the evidence file.
     */
    public function delete(User $user, EvidenceFile $ef): bool
    {
        // uploader and staff can delete
        if ($ef->uploaded_by && $user->id === $ef->uploaded_by) {
            return true;
        }

        $allowedRoles = ['counselor', 'iic', 'registrar', 'administrator'];

        $roleName = null;
        if (is_string($user->role)) {
            $roleName = $user->role;
        } elseif (is_object($user->role) && isset($user->role->name)) {
            $roleName = $user->role->name;
        }

        return in_array($roleName, $allowedRoles, true);
    }
}
