<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PersonalizationSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'last_used_at',
        'resolved_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
