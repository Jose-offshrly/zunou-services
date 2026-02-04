<?php

namespace App\Models;

use App\Contracts\PersonalizationSourceable;
use App\Observers\TeamMessageObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use League\CommonMark\CommonMarkConverter;

#[ObservedBy(TeamMessageObserver::class)]
class TeamMessage extends Model implements PersonalizationSourceable
{
    use \App\Concerns\PersonalizationSourceable;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'team_thread_id',
        'topic_id',
        'user_id',
        'reply_team_thread_id',
        'replied_to_message_id',
        'is_parent_reply',
        'content',
        'metadata',
        'created_at',
        'updated_at',
        'is_edited',
        'role',
        'tool_calls',
        'tool_call_id',
        'is_system',
        'is_delete',
        'is_from_pulse_chat',
        'is_pinned',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_parent_reply' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_delete' => 'boolean',
        'is_from_pulse_chat' => 'boolean',
        'is_pinned' => 'boolean',
    ];

    protected $appends = ['is_deleted'];

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

    public function getContentHtmlAttribute()
    {
        $converter = new CommonMarkConverter();

        return $converter->convertToHtml($this->attributes['content']);
    }

    /**
     * Check if the message is deleted.
     */
    public function getIsDeletedAttribute(): bool
    {
        return $this->trashed();
    }

    public function scopeForCurrentUser(Builder $query)
    {
        return $query->where('user_id', auth()->id());
    }

    public function teamThread(): BelongsTo
    {
        return $this->belongsTo(TeamThread::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function scopeWithContent($query, $content)
    {
        return $query->where('content', 'ILIKE', $content);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function replyTeamThread(): BelongsTo
    {
        return $this->belongsTo(ReplyTeamThread::class);
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(TeamMessageReaction::class);
    }

    public function scopeOnlyNotDeleted(Builder $query)
    {
        return $query->where('is_delete', false);
    }

    public function scopeOnlyDeleted(Builder $query)
    {
        return $query->where('is_delete', true);
    }

    public function reads(): HasMany
    {
        return $this->hasMany(TeamMessageRead::class);
    }

    /**
     * Mark this message as read by a user
     */
    public function markAsRead(User $user): void
    {
        $this->reads()->updateOrCreate(
            ['user_id' => $user->id],
            ['read_at' => now()]
        );
    }

    /**
     * Check if this message has been read by a user
     */
    public function isReadBy(User $user): bool
    {
        // Use eager-loaded relation if available, otherwise query
        if ($this->relationLoaded('reads')) {
            return $this->reads->contains('user_id', $user->id);
        }

        return $this->reads()
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Get the number of unread messages in a thread for a user
     */
    public static function getUnreadCount(string $teamThreadId, User $user): int
    {
        return static::where('team_thread_id', $teamThreadId)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->count();
    }

    public function addReaction(
        User $user,
        string $reaction
    ): TeamMessageReaction {
        return $this->reactions()->create([
            'user_id' => $user->id,
            'reaction' => $reaction,
            'team_message_id' => $this->id,
        ]);
    }

    public function removeReaction(User $user, string $reaction): bool
    {
        return $this->reactions()
            ->where('user_id', $user->id)
            ->where('reaction', $reaction)
            ->delete() > 0;
    }

    public function hasReactionFrom(User $user, string $reaction): bool
    {
        return $this->reactions()
            ->where('user_id', $user->id)
            ->where('reaction', $reaction)
            ->exists();
    }

    public function getReactionCounts(): array
    {
        return $this->reactions()
            ->selectRaw('reaction, COUNT(*) as count')
            ->groupBy('reaction')
            ->pluck('count', 'reaction')
            ->toArray();
    }

    public function getGroupedReactions(): array
    {
        // Use eager-loaded relation if available, otherwise load it
        if ($this->relationLoaded('reactions')) {
            $reactions = $this->reactions;
        } else {
            $reactions = $this->reactions()->with('user')->get();
        }

        // Ensure user relation is loaded for each reaction
        if ($reactions->isNotEmpty() && !$reactions->first()->relationLoaded('user')) {
            $reactions->load('user');
        }

        $grouped = $reactions->groupBy('reaction');

        $result = [];

        foreach ($grouped as $reaction => $userReactions) {
            $result[] = [
                'reaction' => $reaction,
                'count' => $userReactions->count(),
                'users' => $userReactions->pluck('user'),
            ];
        }

        return $result;
    }

    public function repliedToMessage(): BelongsTo
    {
        return $this->belongsTo(TeamMessage::class, 'replied_to_message_id');
    }

    public function files(): MorphMany
    {
        return $this->morphMany(File::class, 'entity');
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
