<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use App\Concerns\BelongsToUser;
use App\Observers\NoteObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

#[ObservedBy(NoteObserver::class)]
class Note extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;
    use BelongsToUser;

    protected $table = 'notes';

    protected $fillable = [
        'id',
        'title',
        'content',
        'tags',
        'pinned',
        'position',
        'pulse_id',
        'organization_id',
        'user_id',
        'data_source_id',
    ];

    protected $casts = [
        'tags' => 'array',
        'pinned' => 'boolean',
    ];

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    /**
     * Get all labels for this note (many-to-many).
     */
    public function labels()
    {
        return $this->belongsToMany(
            Label::class,
            'label_note',
            'note_id',
            'label_id'
        );
    }

    /**
     * Get all files for this note (polymorphic one-to-many).
     */
    public function files(): MorphMany
    {
        return $this->morphMany(File::class, 'entity');
    }

    public function data_source(): HasOne
    {
        return $this->hasOne(DataSource::class, 'id', 'data_source_id');
    }

    public function getCreatedAtAttribute(): ?string
    {
        if (isset($this->attributes['created_at'])) {
            return Carbon::parse(
                $this->attributes['created_at']
            )->userTimezone();
        }

        return null;
    }

    public function getUpdatedAtAttribute(): ?string
    {
        if (isset($this->attributes['updated_at'])) {
            return Carbon::parse(
                $this->attributes['updated_at']
            )->userTimezone();
        }

        return null;
    }
}
