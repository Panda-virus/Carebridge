<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseTimeline extends Model
{
    use HasFactory;

    protected $table = 'case_timelines';

    protected $guarded = [];

    protected $casts = [
        'started_at' => 'datetime',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
        'notes' => 'array',
    ];

    public function caseReport()
    {
        return $this->belongsTo(CaseReport::class, 'case_report_id');
    }
}
