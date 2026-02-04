<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class PersonalizationContext extends Model
{
    protected $fillable = [
        'user_id',
        'source_id',
        'pulse_id',
        'category',
        'context',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(PersonalizationSource::class);
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }

    public function scopeWithUser(Builder $query, User $user)
    {
        return $query->whereHas('user', function ($query) use ($user) {
            return $query->where('id', $user->getKey());
        });
    }
}
