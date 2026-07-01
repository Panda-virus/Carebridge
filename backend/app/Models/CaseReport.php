<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CaseFinding;
use App\Models\User;
use App\Models\RegistrarCaseFile;

class CaseReport extends Model
{
    use HasFactory;

    protected $table = 'case_reports';

    protected $guarded = [];

    protected $casts = [
        'location' => 'array',
        'matched_keywords' => 'array',
        'requires_location_sharing' => 'boolean',
        'is_anonymous' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'incident_date' => 'date',
        'evidence_files' => 'array',
        'findings_files' => 'array',
        'registrar_case_file_id' => 'integer',
    ];

    protected $appends = ['reporter_name'];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function permissionRequestRecord()
    {
        return $this->hasOne(CasePermissionRequest::class)->latestOfMany();
    }

    public function caseFindings()
    {
        return $this->hasMany(CaseFinding::class);
    }

    public function latestFinding()
    {
        return $this->hasOne(CaseFinding::class)->latestOfMany();
    }

    public function registrarCaseFile()
    {
        return $this->belongsTo(RegistrarCaseFile::class, 'registrar_case_file_id');
    }

    public function getReporterNameAttribute(): ?string
    {
        return $this->user?->name ?? $this->student?->name;
    }

    public function caseStatus()
    {
        return $this->belongsTo(CaseStatus::class, 'case_status_id');
    }

    protected static function booted(): void
    {
        static::created(function (self $caseReport) {
            if (empty($caseReport->ticket_number)) {
                $caseReport->ticket_number = self::generateTicketNumber($caseReport->id);
                $caseReport->saveQuietly();
            }
        });
    }

    public static function generateTicketNumber(int $id): string
    {
        return sprintf('CR%06d', $id);
    }
}
