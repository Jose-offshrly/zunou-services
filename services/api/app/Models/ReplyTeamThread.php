<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ReplyTeamThread extends Model
{
    use HasFactory;

    protected $fillable = ['id', 'team_thread_id'];

    public $incrementing = false;

    protected $keyType = 'string';

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

    public function teamChatSystemThreads(): MorphMany
    {
        return $this->morphMany(TeamChatSystemThread::class, 'parentThread');
    }

    public function teamThread(): BelongsTo
    {
        return $this->belongsTo(TeamThread::class);
    }

    public function teamMessages(): HasMany
    {
        return $this->hasMany(TeamMessage::class);
    }

    /**
     * Get messages related to this instance's thread.
     */
    public function getThreadMessages(?string $topicId = null): Collection
    {
        return TeamMessage::with(['user:id,name'])
            ->where('reply_team_thread_id', $this->id)
            ->where('is_parent_reply', false)
            ->where('topic_id', $topicId)
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    public function getCreatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['created_at'])->userTimezone();
    }

    public function getUpdatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['updated_at'])->userTimezone();
    }
}
