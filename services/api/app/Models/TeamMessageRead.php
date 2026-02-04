<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TeamMessageRead extends Model
{
    protected $fillable = ['team_message_id', 'user_id', 'read_at'];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public $incrementing = false;
    protected $keyType   = 'string';

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
}
