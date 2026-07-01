<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseStatus extends Model
{
    use HasFactory;

    protected $table = 'case_statuses';

    protected $fillable = [
        'code',
        'label',
        'handler',
        'sort_order',
    ];

    public $timestamps = true;
}
