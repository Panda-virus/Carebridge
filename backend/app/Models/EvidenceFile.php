<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CaseReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class EvidenceFile extends Model
{
    use HasFactory;

    protected $table = 'evidence_files';

    protected $guarded = [];

    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function caseReport()
    {
        return $this->belongsTo(CaseReport::class, 'case_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
