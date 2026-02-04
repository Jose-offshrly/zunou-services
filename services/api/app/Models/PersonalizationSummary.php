<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalizationSummary extends Model
{
    protected $fillable = [
        'user_id',
        'pulse_id',
        'summary',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }
}
