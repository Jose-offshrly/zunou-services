<?php

namespace App\Models;

use App\Contracts\ThreadInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Thread extends BaseModel implements ThreadInterface
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'organization_id',
        'pulse_id',
        'third_party_id',
        'type',
        'user_id',
        'is_active',
        'is_topic',
    ];

    public function scopeWhereActive($query, $isActive = null)
    {
        if (!is_null($isActive)) {
            $query->where('is_active', $isActive);
        }
        return $query;
    }

    public function scopeForCurrentUser(Builder $query)
    {
        return $query->where('user_id', auth()->id());
    }

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    // Log prompt changes.
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name'])
            ->logOnlyDirty();
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeWithName($query, $name)
    {
        return $query->where('name', 'ILIKE', $name);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function savedMessages()
    {
        return $this->hasMany(SavedMessage::class)->orderBy(
            'created_at',
            'desc'
        );
    }
}
