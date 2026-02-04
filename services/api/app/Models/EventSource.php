<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\EventSourceType;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventSource extends BaseModel
{
    protected $casts = [
        'source' => EventSourceType::class,
        'date' => 'datetime',
        'data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
