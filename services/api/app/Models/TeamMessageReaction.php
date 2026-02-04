<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TeamMessageReaction extends Model
{
    //
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['team_message_id', 'user_id', 'reaction'];

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

    public function teamMessage(): BelongsTo
    {
        return $this->belongsTo(TeamMessage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForMessage(
        Builder $query,
        string $teamMessageId
    ): Builder {
        return $query->where('team_message_id', $teamMessageId);
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForReaction(Builder $query, string $reaction): Builder
    {
        return $query->where('reaction', $reaction);
    }
}
