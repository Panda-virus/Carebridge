<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegistrarCaseFile extends Model
{
    use HasFactory;

    protected $table = 'registrar_case_files';

    protected $guarded = [];

    protected $casts = [
        'findings_files' => 'array',
    ];

    public function caseReport()
    {
        return $this->belongsTo(CaseReport::class, 'case_report_id');
    }
}
