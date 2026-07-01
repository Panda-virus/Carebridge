<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExternalCounselor extends Model
{
    use HasFactory;

    protected $table = 'external_counselors';

    protected $fillable = ['name', 'email', 'phone', 'organization', 'added_by', 'notes', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function requests()
    {
        return $this->hasMany(CounselingRequest::class, 'external_counselor_id');
    }
}
