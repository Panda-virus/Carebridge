<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CaseFinding;
use App\Models\User;
use App\Models\RegistrarCaseFile;
use App\Models\EvidenceFile;

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
        'registrar_case_file_id' => 'integer',
    ];

    protected $appends = ['reporter_name', 'evidence_files'];

    // New clearer relations: affected student and reporting user
    public function affectedStudent()
    {
        return $this->belongsTo(User::class, 'affected_student_id');
    }

    public function reportedByUser()
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }

    // Backwards-compatible accessors for existing code
    public function student()
    {
        return $this->affectedStudent();
    }

    public function user()
    {
        return $this->reportedByUser();
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

    // Registrar files are now stored in `evidence_files` with polymorphic references

    public function evidenceFiles()
    {
        return $this->hasMany(EvidenceFile::class, 'case_id');
    }

    /**
     * Maintain compatibility with existing frontend code which expects
     * an `evidence_files` attribute on the case report containing
     * metadata about uploaded files.
     */
    public function getEvidenceFilesAttribute()
    {
        $files = $this->relationLoaded('evidenceFiles')
            ? $this->getRelation('evidenceFiles')
            : $this->evidenceFiles()->get();

        if (! $files) {
            return [];
        }

        return $files->map(function ($f) {
            return [
                'id' => $f->id,
                'original_name' => $f->original_file_name,
                'name' => $f->original_file_name,
                'stored_file_name' => $f->stored_file_name,
                'size' => $f->file_size,
                'mime' => $f->mime_type,
                'path' => $f->file_path,
                'url' => $f->file_path ? asset("storage/{$f->file_path}") : null,
                'uploaded_by' => $f->uploaded_by,
                'created_at' => $f->created_at,
            ];
        })->toArray();
    }

    public function getFindingsFilesAttribute()
    {
        if ($this->relationLoaded('latestFinding')) {
            return $this->latestFinding?->findings_files;
        }

        return $this->latestFinding?->findings_files;
    }

    public function setFindingsFilesAttribute($value): void
    {
        if (! $this->getConnection()->getSchemaBuilder()->hasColumn($this->getTable(), 'findings_files')) {
            return;
        }

        $this->attributes['findings_files'] = $value;
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
