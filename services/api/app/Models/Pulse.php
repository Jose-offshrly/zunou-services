<?php

namespace App\Models;

use App\Contracts\Eventable;
use App\Contracts\Taskable;
use App\Enums\PulseCategory;
use App\Enums\PulseStatusOption;
use App\Observers\PulseObserver;
use App\Traits\HasMembership;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

#[ObservedBy(PulseObserver::class)]
class Pulse extends Model implements Taskable, Eventable
{
    use \App\Concerns\Eventable;
    use \App\Concerns\Taskable;
    use HasFactory;
    use HasMembership;
    use Notifiable;
    use SoftDeletes;

    protected $table = 'pulses';

    protected $casts = [
        'features' => 'array',
        'category' => PulseCategory::class,
        'status_option' => PulseStatusOption::class,
    ];

    protected $fillable = [
        'id',
        'organization_id',
        'name',
        'type',
        'description',
        'features',
        'icon',
        'category',
        'status_option',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function boot()
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
     * Get the organizations that use this pulse.
     */
    public function organizations()
    {
        return $this->belongsToMany(
            Organization::class,
            'organization_pulse',
        )->withTimestamps();
    }

    /**
     * Get the organization that use this pulse.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the threads in this pulse.
     */
    public function threads()
    {
        return $this->hasMany(Thread::class);
    }

    /**
     * Get saved messages through threads for this pulse.
     * Used for withCount preloading to avoid N+1 queries.
     */
    public function savedMessages(): HasManyThrough
    {
        return $this->hasManyThrough(SavedMessage::class, Thread::class);
    }

    /**
     * Get the goals in this pulse.
     */
    public function strategies()
    {
        return $this->hasMany(Strategy::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(PulseMember::class);
    }

    public function scopeForCurrentUser(Builder $query)
    {
        $userId = Auth::id();

        $query->whereHas('members', function ($query) {
            $query->where('pulse_members.user_id', Auth::id());
        });

        $query
            ->leftJoin('pulse_members', function ($join) use ($userId) {
                $join
                    ->on('pulses.id', '=', 'pulse_members.pulse_id')
                    ->where('pulse_members.user_id', $userId);
            })
            // Select must come before withCount to prevent it from overriding the count column
            ->select('pulses.*')
            // Eager load relations to prevent N+1 in accessors and GraphQL resolvers
            ->with(['notifications.users', 'members.user'])
            // Preload saved message count to avoid N+1 in getSavedMessageCountAttribute
            ->withCount('savedMessages')
            ->orderBy('pulse_members.order', 'asc');

        return $query;
    }

    public function dataSources(): HasMany
    {
        return $this->hasMany(DataSource::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class)->latest();
    }

    public function notification(): HasOne
    {
        return $this->hasOne(Notification::class)->latest();
    }

    public function aiAgents(): HasMany
    {
        return $this->hasMany(AiAgent::class);
    }

    public function taskPhases(): HasMany
    {
        return $this->hasMany(TaskPhase::class);
    }

    public function taskStatuses(): HasMany
    {
        return $this->hasMany(TaskStatus::class);
    }

    /**
     * Get the count of unread (pending) notifications.
     * Uses withCount if available, then eager-loaded relation, otherwise falls back to database query.
     */
    public function getUnreadNotificationsAttribute(): string
    {
        // Check if count was eager loaded via withCount
        if (array_key_exists('unread_notifications_count', $this->attributes)) {
            return (string) $this->attributes['unread_notifications_count'];
        }

        // If notifications relation is already loaded, use collection filter (avoids N+1)
        if ($this->relationLoaded('notifications')) {
            return (string) $this->notifications->where('status', 'pending')->count();
        }

        // Fallback to database query when relation not loaded
        return (string) $this->notifications()->where('status', 'pending')->count();
    }

    /**
     * Get the count of non-archived notifications for the current user.
     * Uses withCount if available, then eager-loaded relation, otherwise falls back to database query.
     */
    public function getNotificationCountAttribute(): string
    {
        // Check if count was eager loaded via withCount
        if (array_key_exists('notification_count', $this->attributes)) {
            return (string) $this->attributes['notification_count'];
        }

        $currentUserId = Auth::id();

        // If notifications relation is already loaded, use collection filter (avoids N+1)
        if ($this->relationLoaded('notifications')) {
            if (! $currentUserId) {
                return (string) $this->notifications->count();
            }

            // Filter collection for non-archived notifications
            return (string) $this->notifications->filter(function ($notification) use ($currentUserId) {
                // Check if notification has users relation loaded
                if ($notification->relationLoaded('users')) {
                    $userPivot = $notification->users->firstWhere('id', $currentUserId);

                    // If user not in pivot, include notification
                    // If user in pivot and not archived, include notification
                    return ! $userPivot || ! $userPivot->pivot->is_archived;
                }

                // If users not loaded, include the notification (conservative approach)
                return true;
            })->count();
        }

        // Fallback to database query when relation not loaded
        if (! $currentUserId) {
            return (string) $this->notifications()->count();
        }

        return (string) $this->notifications()
            ->where(function ($query) use ($currentUserId) {
                $query
                    ->whereDoesntHave('users', function ($q) use ($currentUserId) {
                        $q->where('users.id', $currentUserId);
                    })
                    ->orWhereHas('users', function ($q) use ($currentUserId) {
                        $q->where('users.id', $currentUserId)
                          ->where('notification_user.is_archived', false);
                    });
            })
            ->count();
    }

    /**
     * Get the count of members.
     * Uses withCount if available, or loaded relation, otherwise falls back to database query.
     */
    public function getMemberCountAttribute(): string
    {
        // Check if count was eager loaded via withCount
        if (array_key_exists('members_count', $this->attributes)) {
            return (string) $this->attributes['members_count'];
        }

        // If members relation is already loaded, use collection count (avoids extra query)
        if ($this->relationLoaded('members')) {
            return (string) $this->members->count();
        }

        // Fallback to efficient database count query
        return (string) $this->members()->count();
    }

    public function team_thread(): HasOne
    {
        return $this->hasOne(TeamThread::class, 'pulse_id');
    }

    /**
     * Get the count of saved messages.
     * Uses withCount if available, otherwise falls back to database query.
     */
    public function getSavedMessageCountAttribute(): string
    {
        // Check if count was eager loaded via withCount
        if (array_key_exists('saved_messages_count', $this->attributes)) {
            return (string) $this->attributes['saved_messages_count'];
        }

        return (string) SavedMessage::whereHas('thread', function ($query) {
            $query->where('pulse_id', $this->id);
        })->count();
    }

    /**
     * Cached computed name for ONETOONE pulses to avoid N+1 queries.
     * Key is the user ID to support different users viewing the same pulse.
     * This is intentionally NOT persisted during serialization.
     */
    protected array $cachedComputedName = [];

    /**
     * Clear transient cache when model is unserialized (e.g., from queue).
     */
    public function __wakeup(): void
    {
        parent::__wakeup();
        $this->cachedComputedName = [];
    }

    /**
     * For one-to-one pulses, expose the other participant's name as the pulse name.
     */
    public function getNameAttribute($value): string
    {
        if ($this->category !== PulseCategory::ONETOONE) {
            return $value;
        }

        $currentUserId = Auth::id();
        if (! $currentUserId) {
            return $value;
        }

        // Return cached value if already computed for this user
        // Use array_key_exists to properly handle null cached values
        if (array_key_exists($currentUserId, $this->cachedComputedName)) {
            return $this->cachedComputedName[$currentUserId];
        }

        // Prefer already-loaded members to avoid extra queries.
        if ($this->relationLoaded('members')) {
            $otherMember = $this->members->firstWhere('user_id', '!=', $currentUserId);

            // Get user name from loaded relation or load it
            if ($otherMember) {
                if ($otherMember->relationLoaded('user')) {
                    $computedName = $otherMember->user?->name ?? $value;
                    $this->cachedComputedName[$currentUserId] = $computedName;
                    return $computedName;
                }

                // User not loaded - get name directly via join to avoid N+1
                $userName = PulseMember::where('pulse_members.id', $otherMember->id)
                    ->join('users', 'pulse_members.user_id', '=', 'users.id')
                    ->value('users.name');

                $computedName = $userName ?? $value;
                $this->cachedComputedName[$currentUserId] = $computedName;
                return $computedName;
            }

            $this->cachedComputedName[$currentUserId] = $value;
            return $value;
        }

        // Members not loaded - get the other user's name directly via join query
        $userName = PulseMember::where('pulse_members.pulse_id', $this->id)
            ->where('pulse_members.user_id', '!=', $currentUserId)
            ->join('users', 'pulse_members.user_id', '=', 'users.id')
            ->value('users.name');

        $computedName = $userName ?? $value;
        $this->cachedComputedName[$currentUserId] = $computedName;
        return $computedName;
    }

    public function getHasGuestAttribute(): bool
    {
        return $this->members->where('role', 'GUEST')->isNotEmpty();
    }

    public function getUnreadTeamMessagesAttribute(): Collection
    {
        $currentUserId = Auth::id();

        if (! $this->relationLoaded('team_thread')) {
            $this->load([
                'team_thread.teamMessages' => function ($query) use ($currentUserId) {
                    $query
                        ->whereNotNull('team_messages.team_thread_id')
                        ->whereDoesntHave('reads', fn ($q) => $q->where('user_id', $currentUserId))
                        ->with(['files', 'reactions.user', 'reads']);
                },
            ]);
        }

        if (! $this->team_thread) {
            return collect([]);
        }

        // Use already-loaded messages when available to avoid N+1
        if ($this->team_thread->relationLoaded('teamMessages')) {
            return $this->team_thread->teamMessages->filter(function ($message) use ($currentUserId) {
                if ($message->relationLoaded('reads')) {
                    return ! $message->reads->contains('user_id', $currentUserId);
                }

                // reads not loaded - hit the DB (shouldn't happen often)
                return ! $message->reads()->where('user_id', $currentUserId)->exists();
            })->values();
        }

        return TeamMessage::where('team_thread_id', $this->team_thread->id)
            ->whereNotNull('team_thread_id')
            ->whereDoesntHave('reads', function ($query) use ($currentUserId) {
                $query->where('user_id', $currentUserId);
            })
            ->get();
    }

    public function getPulseInformation($includeMembers = true)
    {
        $infoBuilder = '';
        if ($includeMembers) {
            $pulseMembers = $this->getFormattedPulseMembers();
            $infoBuilder .= "Here are the pulse members: $pulseMembers\n";
        }
        // append here the other info to share in pulse

        $pulseMission = $this->getPulseMission();
        $infoBuilder .= "Here are the missions in this pulse: $pulseMission()\n";

        return $infoBuilder;
    }

    private function getFormattedPulseMembers()
    {
        $members = PulseMember::with('user')
            ->where('pulse_id', $this->id)
            ->get();

        $membersList = [];

        foreach ($members as $member) {
            $membersList[] = $member->user->name.' ('.$member->role->value.')';
        }

        return implode(', ', $membersList);
    }

    private function getPulseMission()
    {
        $pulseMissions = $this->strategies()
            ->where('type', 'missions')
            ->get()
            ->map(function ($mission) {
                return [
                    'title'              => $mission->title,
                    'prompt_description' => $mission->prompt_description ?? $mission->description,
                ];
            });

        $missionContext = ! empty($pulseMissions)
            ? "This pulse has the following missions:\n".
                collect($pulseMissions)
                    ->map(
                        fn (
                            $mission,
                        ) => "- {$mission['title']}: {$mission['prompt_description']}",
                    )
                    ->join("\n")
            : 'This pulse has no defined missions yet.';

        return $missionContext;
    }
}
