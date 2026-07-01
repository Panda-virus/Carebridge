<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselorSchedule extends Model
{
    use HasFactory;

    protected $table = 'counselor_schedules';

    protected $fillable = ['counselor_id', 'week_start_date', 'week_end_date', 'available_slots'];

    protected $appends = ['counselor_name'];

    protected $casts = [
        'available_slots' => 'array',
    ];

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function getCounselorNameAttribute(): ?string
    {
        return $this->counselor?->name;
    }
}
