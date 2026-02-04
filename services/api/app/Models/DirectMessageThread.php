<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DirectMessageThread extends Model
{
    use BelongsToOrganization;

    // Disable auto-incrementing because UUIDs are used.
    public $incrementing = false;

    protected $keyType = 'string';

    // Allow mass assignment on these fields.
    protected $fillable = [
        'organization_id',
        'participants', // JSON array of user IDs.
    ];

    // Cast the participants JSON column to an array.
    protected $casts = [
        'participants' => 'array',
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

        // Add global scope to only show threads where the user is a participant
        static::addGlobalScope('participant_access', function (
            Builder $builder,
        ) {
            $user = Auth::user();
            if ($user) {
                $builder->whereJsonContains('participants', $user->id);
            }
        });
    }

    /**
     * Define a relationship with DirectMessage.
     */
    public function directMessages(): HasMany
    {
        return $this->hasMany(
            DirectMessage::class,
            'direct_message_thread_id',
        )->withTrashed(); // Always include soft-deleted messages
    }

    /**
     * Define a relationship with User.
     */
    public function getOtherParticipantAttribute(): ?User
    {
        $user = Auth::user();
        if ($user && is_array($this->participants)) {
            $otherIds = array_filter(
                $this->participants,
                fn ($id) => $id != $user->id,
            );
            $otherId = reset($otherIds);
            if ($otherId) {
                return User::find($otherId);
            }
        }

        return null;
    }
}
