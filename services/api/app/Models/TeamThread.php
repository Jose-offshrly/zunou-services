<?php

namespace App\Models;

use App\Contracts\ThreadInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TeamThread extends BaseModel implements ThreadInterface
{
    use HasFactory;

    protected $fillable = ['id', 'pulse_id', 'organization_id'];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::orderedUuid();
            }
        });

        // Add global scope to only show team threads from pulses where user is a member
        static::addGlobalScope('member_access', function (Builder $builder) {
            $user = Auth::user();
            if ($user) {
                $builder->whereHas('pulse', function ($query) use ($user) {
                    $query->whereHas('members', function ($query) use ($user) {
                        $query->where('pulse_members.user_id', $user->id);
                    });
                });
            }
        });
    }

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function teamChatSystemThreads(): MorphMany
    {
        return $this->morphMany(TeamChatSystemThread::class, 'parentThread');
    }

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function teamMessages(): HasMany
    {
        return $this->hasMany(TeamMessage::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }

    public function replyTeamThreads(): HasMany
    {
        return $this->hasMany(ReplyTeamThread::class);
    }

    /**
     * Get messages related to this instance's thread.
     */
    public function getThreadMessages(
        ?string $toDate = null,
        ?string $topicId = null
    ): Collection {
        $query = TeamMessage::with([
            'user:id,name',
            'replyTeamThread.teamMessages',
        ])
            ->where('team_thread_id', $this->id)
            ->where('topic_id', $topicId)
            ->where(function ($query) {
                $query
                    ->where('reply_team_thread_id', null)
                    ->orWhere('is_parent_reply', true);
            });

        if ($toDate) {
            $query->where('created_at', '<=', $toDate);
        }

        return $query
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    /**
     * Get messages filtered by topic.
     */
    public function getThreadMessagesByTopic(
        ?string $topicId = null,
        ?string $toDate = null
    ): Collection {
        $query = TeamMessage::with([
            'user:id,name',
            'replyTeamThread.teamMessages',
            'topic:id,name',
        ])
            ->where('team_thread_id', $this->id)
            ->where(function ($query) {
                $query
                    ->where('reply_team_thread_id', null)
                    ->orWhere('is_parent_reply', true);
            });

        if ($topicId) {
            $query->where('topic_id', $topicId);
        } else {
            // For main thread, get messages without topic_id
            $query->whereNull('topic_id');
        }

        if ($toDate) {
            $query->where('created_at', '<=', $toDate);
        }

        return $query
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }
}
