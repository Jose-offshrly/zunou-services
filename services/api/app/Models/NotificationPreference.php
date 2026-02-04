<?php

namespace App\Models;

use App\Enums\NotificationPreferenceMode;
use App\Enums\NotificationPreferenceScopeType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'scope_type',
        'scope_id',
        'mode',
    ];

    public $timestamps = true;

    protected $casts = [
        'scope_type' => NotificationPreferenceScopeType::class,
        'mode'       => NotificationPreferenceMode::class,
    ];

    public $incrementing = false;
    protected $keyType   = 'string';

    protected static function boot(): void
    {
        parent::boot();

        // Generate a UUID when creating a new model instance
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the user that owns the notification preference.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the scoped entity (pulse or topic) based on scope_type.
     */
    public function scope(): BelongsTo
    {
        return match ($this->scope_type) {
            NotificationPreferenceScopeType::pulse => $this->belongsTo(Pulse::class, 'scope_id'),
            NotificationPreferenceScopeType::topic => $this->belongsTo(Topic::class, 'scope_id'),
            default => $this->belongsTo(User::class, 'scope_id'), // fallback for global (won't be used)
        };
    }

    /**
     * Get the pulse if scope_type is pulse.
     */
    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class, 'scope_id');
    }

    /**
     * Get the topic if scope_type is topic.
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'scope_id');
    }

    /**
     * Scope to filter notification preferences for a user.
     * Defaults to current authenticated user if userId is not provided.
     */
    public function scopeForCurrentUser(Builder $query, ?array $args = []): Builder
    {
        // If userId is provided in args, let the @where directive handle it
        if (! empty($args['userId'])) {
            return $query;
        }

        // Otherwise, filter by the current authenticated user
        return $query->where('user_id', Auth::id());
    }
}
