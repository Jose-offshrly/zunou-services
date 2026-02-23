<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @deprecated Part of deprecated DirectMessage system. Use TeamMessage read tracking instead.
 */
class DirectMessageRead extends Model
{
    public $incrementing = false;
    protected $keyType   = 'string';

    protected $fillable = ['direct_message_id', 'user_id'];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted(): void
    {
        static::creating(function ($model) {
            $model->id = (string) Str::orderedUuid();
        });
    }

    /**
     * Relationship to the direct message.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(DirectMessage::class, 'direct_message_id');
    }

    /**
     * Relationship to the user who read the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
