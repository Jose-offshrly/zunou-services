<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MisalignmentReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'thread_id',
        'violated_value',
        'explanation',
        'severity',
        'detected_at',
    ];

    // Relationships (optional)
    public function organization()
    {
        return $this->belongsTo(
            Organization::class,
            'organization_id',
            'id',
            'uuid',
        );
    }

    public function thread()
    {
        return $this->belongsTo(Thread::class, 'thread_id', 'id', 'uuid');
    }
}
