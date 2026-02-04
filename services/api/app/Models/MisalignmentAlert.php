<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MisalignmentAlert extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'violated_value',
        'summary',
        'severity',
        'detected_at',
        'acknowledged',
        'acknowledged_at',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(
            Organization::class,
            'organization_id',
            'id',
            'uuid',
        );
    }
}
