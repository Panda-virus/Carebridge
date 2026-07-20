<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoleAuditLog extends Model
{
    use HasFactory;

    protected $table = 'role_audit_logs';

    protected $fillable = [
        'role_name',
        'action',
        'changed_by',
        'subject_id',
        'subject_type',
        'old_value',
        'new_value',
        'details',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function changer()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
