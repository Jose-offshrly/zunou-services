<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Topic extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id',
        'entity_id',
        'entity_type',
        'reference_id',
        'reference_type',
        'name',
        'created_by',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'created_by' => 'string',
        'entity_id' => 'string',
        'entity_type' => 'string',
        'reference_id' => 'string',
        'reference_type' => 'string',
        'team_message_reference' => 'string',
    ];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::orderedUuid();
        });
    }

    /**
     * Get the team thread that owns this topic.
     */
    // teamThread relation will be resolved via GraphQL field resolver to handle polymorphism

    /**
     * Get the user who created this topic.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    /**
     * Get all team messages for this topic.
     */
    public function teamMessages(): HasMany
    {
        return $this->hasMany(TeamMessage::class);
    }

    /**
     * Get the owning entity (polymorphic relationship).
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the owning reference (polymorphic relationship).
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope to get only custom topics.
     */
    public function scopeCustom($query)
    {
        return $query;
    }

    public function teamMessageReference(): HasOne
    {
        return $this->hasOne(
            TeamMessage::class,
            'id',
            'team_message_reference'
        );
    }
}
