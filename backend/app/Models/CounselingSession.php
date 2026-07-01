<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CounselingRequest;

class CounselingSession extends Model
{
    use HasFactory;

    public function request()
    {
        return $this->belongsTo(CounselingRequest::class, 'request_id');
    }

    protected $table = 'counseling_sessions';

    protected $fillable = ['request_id', 'session_number', 'date', 'notes', 'score', 'completed'];

    protected $casts = [
        'completed' => 'boolean',
        'score' => 'integer',
    ];
}
