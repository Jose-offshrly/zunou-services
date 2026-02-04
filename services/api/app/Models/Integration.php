<?php

namespace App\Models;

use App\Enums\SyncStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class Integration extends BaseModel
{
    protected $fillable = [
        'id',
        'pulse_id',
        'user_id',
        'type',
        'api_key',
        'secret_key',
        'sync_status',
    ];

    protected $hidden = ['secret_key'];

    protected $casts = [
        'sync_status' => SyncStatus::class,
    ];

    /**
     * Encrypt the API key before saving to the database
     */
    public function setApiKeyAttribute($value)
    {
        $this->attributes['api_key'] = Crypt::encryptString($value);
    }

    /**
     * Decrypt the API key when retrieving from the database
     */
    public function getApiKeyAttribute($value)
    {
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            Log::error('Failed to decrypt API key: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Encrypt the secret key before saving to the database
     */
    public function setSecretKeyAttribute($value)
    {
        $this->attributes['secret_key'] = Crypt::encryptString($value);
    }

    /**
     * Decrypt the secret key when retrieving from the database
     */
    public function getSecretKeyAttribute($value)
    {
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            Log::error('Failed to decrypt API key: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Find an integration by its decrypted API key
     */
    public static function findByApiKey(
        string $apiKey,
        ?string $userId = null,
        ?string $pulseId = null
    ) {
        $query = static::query();

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($pulseId) {
            $query->where('pulse_id', $pulseId);
        }

        $integrations = $query->get();

        foreach ($integrations as $integration) {
            if (
                Crypt::decryptString($integration->attributes['api_key']) ===
                $apiKey
            ) {
                return $integration;
            }
        }

        return null;
    }

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }
}
