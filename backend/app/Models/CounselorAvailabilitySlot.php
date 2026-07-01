<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CounselorAvailabilitySlot extends Model
{
    use HasFactory;

    protected $table = 'counselor_availability_slots';

    protected $fillable = ['schedule_id', 'day_of_week', 'start_time', 'end_time', 'slot_duration'];
}
