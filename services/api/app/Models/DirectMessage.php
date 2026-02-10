<?php

namespace App\Models;

use App\Observers\DirectMessageObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @deprecated Use TeamMessage with ONETOONE pulse category instead. This class is maintained for backward compatibility only.
 */
#[ObservedBy(DirectMessageObserver::class)]
class DirectMessage extends Model
{
    //
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'direct_message_thread_id',
        'sender_id',
        'content',
        'is_edited',
        'is_pinned',
        'replied_to_message_id',
    ];

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
     * Relationship to the DirectMessageThread.
     */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(
            DirectMessageThread::class,
            'direct_message_thread_id'
        );
    }

    /**
     * Relationship to the sender.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Relationship to message reads.
     */
    public function reads(): HasMany
    {
        return $this->hasMany(DirectMessageRead::class, 'direct_message_id');
    }

    /**
     * Get all files for this direct message (polymorphic one-to-many).
     */
    public function files(): MorphMany
    {
        return $this->morphMany(File::class, 'entity');
    }

    public function getCreatedAtAttribute(): string
    {
        return Carbon::parse(
            $this->attributes['created_at'],
            'UTC'
        )->userTimezone();
    }

    /**
     * Get the other participant in the direct message thread.
     */
    public function getOtherParticipantAttribute(): ?User
    {
        $thread = $this->thread;
        if (!$thread || !is_array($thread->participants)) {
            return null;
        }

        $otherIds = array_filter(
            $thread->participants,
            fn($id) => $id != $this->sender_id
        );
        $otherId = reset($otherIds);

        return $otherId ? User::find($otherId) : null;
    }

    public function repliedToMessage(): BelongsTo
    {
        return $this->belongsTo(DirectMessage::class, 'replied_to_message_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(
            DirectMessageReaction::class,
            'direct_message_id'
        );
    }

    public function addReaction(
        User $user,
        string $reaction
    ): DirectMessageReaction {
        return $this->reactions()->create([
            'user_id' => $user->id,
            'reaction' => $reaction,
            'direct_message_id' => $this->id,
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
        $reactions = $this->reactions()
            ->with('user')
            ->get()
            ->groupBy('reaction');

        $grouped = [];

        foreach ($reactions as $reaction => $userReactions) {
            $grouped[] = [
                'reaction' => $reaction,
                'count' => $userReactions->count(),
                'users' => $userReactions->pluck('user'),
            ];
        }

        return $grouped;
    }
}
