<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CaseReport;
use App\Models\User;

class CaseFinding extends Model
{
    use HasFactory;

    protected $table = 'case_findings';

    protected $guarded = [];

    protected $casts = [
        'findings_files' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function caseReport()
    {
        return $this->belongsTo(CaseReport::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
