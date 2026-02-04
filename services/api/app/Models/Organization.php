<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory;
    use Notifiable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'zunou_ai_staff_id',
        'domain',
        'industry',
        'description',
        'metadata',
    ];

    protected $casts = [
        'industry' => 'array',
        'metadata' => 'array',
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

    public function setFileKeyAttribute($value): void
    {
        $metadata                     = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileKey']          = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    public function setFileNameAttribute($value): void
    {
        $metadata                     = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileName']         = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    public function getLogoAttribute()
    {
        // Check if metadata exists and contains a fileKey for the logo
        if (! $this->metadata || ! isset($this->metadata['fileKey'])) {
            return null;
        }

        return config('app.url') . '/api/organization/' . $this->id . '/logo';
    }

    public function dataSources(): HasMany
    {
        return $this->hasMany(DataSource::class);
    }

    public function organizationUsers(): HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }

    public function pulses(): HasMany
    {
        return $this->hasMany(Pulse::class);
    }

    public function aiAgents(): HasMany
    {
        return $this->hasMany(AiAgent::class);
    }

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'organization_users',
            'organization_id',
            'user_id',
        );
    }

    /**
     * Encrypt the slack_access_token attribute before storing it.
     */
    public function setSlackAccessTokenAttribute($value)
    {
        $this->attributes['slack_access_token'] = Crypt::encryptString($value);
    }

    /**
     * Decrypt the slack_access_token attribute when accessed.
     */
    public function getSlackAccessTokenAttribute($value)
    {
        if (! $value) {
            return null;
        }

        return Crypt::decryptString($value);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class)->latest();
    }

    public function getHasGuestAttribute(): bool
    {
        return $this->organizationUsers->where('role', 'GUEST')->isNotEmpty();
    }
}
