<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CounselingSession;
use App\Models\ExternalCounselor;

class CounselingRequest extends Model
{
    use HasFactory;

    protected $table = 'counseling_requests';

    protected $fillable = [
        'student_id', 'concern', 'category', 'urgency_level', 'preferred_time', 'status',
        'requires_immediate_attention', 'matched_keywords', 'proposed_date', 'proposed_time',
        'student_approved', 'counselor_approved', 'student_rejected_at', 'counselor_rejected_at',
        'counselor_id', 'scheduled_date', 'scheduled_time', 'total_sessions', 'completed_sessions',
        'session_notes', 'session_scores', 'overall_score', 'external_session_records',
        'recommendations', 'referral_reason', 'external_counselor_id',
    ];

    protected $appends = [
        'student_name',
        'student_email',
        'student_phone',
        'counselor_name',
        'external_counselor_info',
    ];

    protected $casts = [
        'matched_keywords' => 'array',
        'session_notes' => 'array',
        'session_scores' => 'array',
        'external_session_records' => 'array',
        'overall_score' => 'decimal:2',
        'requires_immediate_attention' => 'boolean',
        'student_rejected_at' => 'datetime',
        'counselor_rejected_at' => 'datetime',
        'proposed_date' => 'date',
        'scheduled_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function sessions()
    {
        return $this->hasMany(CounselingSession::class, 'request_id');
    }

    public function externalCounselor()
    {
        return $this->belongsTo(ExternalCounselor::class, 'external_counselor_id');
    }

    public function getStudentNameAttribute(): ?string
    {
        return $this->student?->name;
    }

    public function getStudentEmailAttribute(): ?string
    {
        return $this->student?->email;
    }

    public function getStudentPhoneAttribute(): ?string
    {
        return $this->student?->phone;
    }

    public function getCounselorNameAttribute(): ?string
    {
        return $this->counselor?->name;
    }

    public function getExternalCounselorInfoAttribute(): ?string
    {
        $external = $this->externalCounselor;
        if (! $external) {
            return null;
        }

        $parts = array_filter([$external->name, $external->organization, $external->email]);
        return implode(' — ', $parts);
    }

    protected static function booted(): void
    {
        static::saving(function (self $request) {
            if ($request->student_id && ! $request->relationLoaded('student')) {
                $request->load('student');
            }
        });
    }
}
