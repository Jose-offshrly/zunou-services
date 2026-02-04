<?php

namespace App\Models;

use App\Contracts\Eventable;
use App\Enums\OrganizationStatus;
use App\Enums\OrganizationUserStatus;
use App\Enums\UserPresence;
use App\Observers\UserObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

#[ObservedBy(UserObserver::class)]
class User extends Authenticatable implements Eventable
{
    use \App\Concerns\Eventable;
    use \App\Traits\OpenAiAttributes;
    use \App\Traits\AssemblyAiAttributes;
    use HasApiTokens;
    use HasFactory;
    use HasPushSubscriptions;
    use Notifiable;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'last_organization_id',
        'name',
        'email',
        'password',
        'auth0_id',
        'apple_auth0_id',
        'stripe_customer_id',
        'timezone',
        'presence',
        'google_calendar_linked',
        'google_calendar_access_token',
        'google_calendar_refresh_token',
        'google_calendar_expires_at',
        'google_calendar_channel_id',
        'google_calendar_resource_id',
        'google_calendar_channel_expires_at',
        'google_calendar_sync_token',
        'first_login_at',
        'onboarded',
        'openai_api_key',
        'assemblyai_key',
        'request_delete_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'openai_api_key',
        'assemblyai_key',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'permissions' => 'array',
        'presence' => UserPresence::class,
        'google_calendar_linked' => 'boolean',
        'google_calendar_expires_at' => 'datetime',
        'google_calendar_channel_expires_at' => 'datetime',
        'first_login_at' => 'datetime',
        'onboarded' => 'boolean',
        'request_delete_at' => 'datetime',
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
     * The channels the user receives notification broadcasts on.
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'users.' . $this->id;
    }

    public function getGoogleCalendarCredentialsAttribute(): array
    {
        return [
            'access_token' => $this->google_calendar_access_token,
            'refresh_token' => $this->google_calendar_refresh_token,
            'email' => $this->google_calendar_email,
            'expires_at' => $this->google_calendar_expires_at,
        ];
    }

    public function updateGoogleCalendarToken(array $newToken): void
    {
        $updateData = [
            'google_calendar_access_token' => $newToken['access_token'],
            'google_calendar_refresh_token' =>
                $newToken['refresh_token'] ??
                $this->google_calendar_refresh_token,
        ];

        if (isset($newToken['expires_at'])) {
            $updateData['google_calendar_expires_at'] = $newToken['expires_at'];
        }

        $this->update($updateData);
    }

    public function getPermissionsAttribute(): array
    {
        $permissions = $this->attributes['permissions'] ?? null;

        if (empty($permissions)) {
            return [];
        }

        // Handle both cases: array (just assigned) or string (from database)
        if (is_array($permissions)) {
            return $permissions;
        }

        return json_decode($permissions, true) ?? [];
    }

    public function getGravatarAttribute()
    {
        return 'https://www.gravatar.com/avatar/' .
            md5(strtolower(trim($this->email))) .
            '?s=200&d=retro';
    }

    public function hasOrganization(string $organizationId): bool
    {
        return in_array($organizationId, $this->organizationIds(), true);
    }

    public function hasPulse(string $pulseId): bool
    {
        return in_array($pulseId, $this->pulseIds(), true);
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions, true);
    }

    public function isFirstTimeLogin(): bool
    {
        return is_null($this->first_login_at);
    }

    public function organizations()
    {
        return $this->belongsToMany(
            Organization::class,
            'organization_users',
            'user_id',
            'organization_id'
        )->where('organizations.status', OrganizationStatus::Active->value);
    }

    public function organizationIds(): array
    {
        return Cache::remember(
            'user:' . $this->id . ':organization-ids',
            60,
            function () {
                return $this->organizationUsers()
                    ->where('status', OrganizationUserStatus::Active->value)
                    ->pluck('organization_id')
                    ->toArray();
            }
        );
    }

    public function pulseIds(): array
    {
        return Cache::remember(
            'user:' . $this->id . ':pulse-ids',
            60,
            function () {
                return Pulse::whereIn(
                    'organization_id',
                    $this->organizationIds()
                )
                    ->pluck('id')
                    ->toArray();
            }
        );
    }

    public function organizationUsers(): HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function pulseMemberships(): HasMany
    {
        return $this->hasMany(PulseMember::class);
    }

    public function timesheet(): HasMany
    {
        return $this->hasMany(Timesheet::class);
    }

    public function eventSources(): HasMany
    {
        return $this->hasMany(EventSource::class);
    }

    public function getDirectMessageThreadsAttribute(): Collection
    {
        return DirectMessageThread::whereJsonContains(
            'participants',
            $this->id
        )->get();
    }

    /**
     * Get unread direct messages for this user.
     */
    public function getUnreadDirectMessagesAttribute(): Collection
    {
        $currentUser = Auth::user();
        $currentUserId = $currentUser->id;

        // First, find the thread where both users are participants
        $thread = DirectMessageThread::where(
            'organization_id',
            $currentUser->last_organization_id
        )
            ->whereJsonContains('participants', (string) $currentUserId)
            ->whereJsonContains('participants', (string) $this->id)
            ->first();

        if (!$thread) {
            return collect();
        }

        // Then get unread messages from that thread
        return DirectMessage::with(['sender', 'thread'])
            ->where('direct_message_thread_id', $thread->id)
            ->where('sender_id', '!=', $currentUserId)
            ->whereDoesntHave('reads', function ($query) use ($currentUserId) {
                $query->where('user_id', $currentUserId);
            })
            ->latest()
            ->get();
    }

    // In the User class
    public function notifications()
    {
        return $this->belongsToMany(
            Notification::class,
            'notification_user'
        )->withPivot('read_at');
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function context(): HasOne
    {
        return $this->hasOne(UserContext::class);
    }

    public function personalizationSummaries(): HasMany
    {
        return $this->hasMany(PersonalizationSummary::class);
    }

    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(Contact::class);
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    public function getUserContext(): string
    {
        // Use eager loading to reduce database queries (N+1 problem)
        $personalizations =
            $this->personalizations ??
            Personalization::where('user_id', $this->id)->get();
        $orgUser =
            $this->organizationUsers->first() ??
            OrganizationUser::where('user_id', $this->id)->first();

        // Initialize context array with default values
        $context = [
            'strategies' => 'No strategies set yet.',
            'preferences' => 'No preferences set yet.',
            'actions' => 'No recent actions recorded.',
            'personality' => 'No personality set yet.',
            'communication_style' => 'No communication style set yet.',
        ];

        // Map personalization types to context keys
        $mapping = [
            'strategies' => 'strategies',
            'preference' => 'preferences',
            'action' => 'actions',
            'personality' => 'personality',
            'communication_style' => 'communication_style',
        ];

        // Process personalizations if they exist
        if ($personalizations->isNotEmpty()) {
            foreach ($personalizations as $personalization) {
                $type = $personalization->type;
                if (
                    isset($mapping[$type]) &&
                    !empty($personalization->summary)
                ) {
                    // If we have a value, replace the default
                    if (
                        $context[$mapping[$type]] ===
                            "No {$mapping[$type]} set yet." ||
                        $context[$mapping[$type]] ===
                            'No recent actions recorded.'
                    ) {
                        $context[$mapping[$type]] = '';
                    }

                    // Append the new entry
                    $context[$mapping[$type]] .=
                        '- ' . $personalization->summary . "\n";
                }
            }
        }

        // Get job title
        $job =
            $orgUser && !empty($orgUser->job_title)
                ? $orgUser->job_title
                : 'No job position specified';

        // Build the prompt using heredoc syntax
        return <<<EOD
User Context:
- **Strategies**: {$context['strategies']}
- **Preferences**: {$context['preferences']}
- **Actions**: {$context['actions']}
- **Personality**: {$context['personality']}
- **Communication Style**: {$context['communication_style']}
- **Company Job Position**: {$job}

These elements will build up over time. Initially, they may be empty.
They are core to generating accurate and personalized responses. Always factor in:
- **Strategies**: Align responses with the user's objectives.
- **Preferences**: Tailor the tone, formality, and style to the user's preferences.
- **Actions**: Incorporate recent activities or tasks to reflect the user's current context.
- **Personality**: Capture individual traits.
- **Communication Style**: Reflect the user's preferred communication style.
EOD;
    }
}
