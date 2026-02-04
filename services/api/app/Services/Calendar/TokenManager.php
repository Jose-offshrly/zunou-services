<?php

namespace App\Services\Calendar;

use App\Models\User;
use Google\Client;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class TokenManager
{
    public static function refreshGoogleToken(User $user, array &$credentials): void
    {
        $client = new Client();
        $client->setClientId(config('google-calendar.auth_profiles.oauth.client_id'));
        $client->setClientSecret(config('google-calendar.auth_profiles.oauth.client_secret'));
        $client->setAccessType('offline');
        $client->setIncludeGrantedScopes(true);
        $client->setPrompt('consent');
        $client->setScopes([
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
        ]);
        
        // Check if token is expired using stored expires_at first
        $isExpired = false;
        $expiresAt = null;
        
        // First, try to use stored expires_at if available
        if (isset($credentials['expires_at']) && $credentials['expires_at']) {
            $expiresAt = $credentials['expires_at'];
            if ($expiresAt instanceof Carbon) {
                // Add a 60 second buffer to refresh before actual expiration
                $isExpired = Carbon::now()->addSeconds(60)->greaterThanOrEqualTo($expiresAt);
            } elseif (is_string($expiresAt)) {
                $expiresAt = Carbon::parse($expiresAt);
                $isExpired = Carbon::now()->addSeconds(60)->greaterThanOrEqualTo($expiresAt);
            }
            
            Log::debug('Checked token expiration using stored expires_at', [
                'user_id'    => $user->id,
                'expires_at' => $expiresAt instanceof Carbon ? $expiresAt->toIso8601String() : (string) $expiresAt,
                'is_expired' => $isExpired,
            ]);
        } else {
            // Fallback to Google Client's expiration check if expires_at not stored
            $accessTokenData = $credentials['access_token'];
            
            // Try to decode if it's a JSON string, otherwise use as-is
            if (is_string($accessTokenData)) {
                $decoded = json_decode($accessTokenData, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $accessTokenData = $decoded;
                }
            }
            
            $client->setAccessToken($accessTokenData);
            
            try {
                $isExpired = $client->isAccessTokenExpired();
            } catch (\Exception $e) {
                // If we can't determine expiration, assume token is valid
                // This prevents unnecessary refresh calls
                Log::debug('Could not determine token expiration, assuming valid', [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        if ($credentials['refresh_token'] && $isExpired) {
            try {
                Log::info('Access token expired, refreshing token', [
                    'user_id' => $user->id,
                ]);

                $accessToken = $client->fetchAccessTokenWithRefreshToken(
                    $credentials['refresh_token'],
                );

                // Check if the response contains an error
                if (isset($accessToken['error'])) {
                    Log::error(
                        'Error fetching access token with refresh token',
                        [
                            'error'             => $accessToken['error'],
                            'error_description' => $accessToken['error_description'] ?? 'No description provided',
                            'user_id'           => $user->id,
                        ],
                    );

                    throw new \Exception(
                        "Failed to refresh access token: {$accessToken['error_description']}",
                    );
                }

                $credentials['access_token']  = $accessToken['access_token'];
                $credentials['refresh_token'] = $accessToken['refresh_token'] ?? $credentials['refresh_token'];
                $credentials['expires_at']    = Carbon::now()->addSeconds($accessToken['expires_in']);

                $user->updateGoogleCalendarToken($credentials);

                Log::info(
                    'Successfully refreshed Google Calendar access token',
                    [
                        'user_id' => $user->id,
                    ],
                );
            } catch (\Exception $e) {
                Log::error(
                    'Failed to refresh Google Calendar access token',
                    [
                        'error'   => $e->getMessage(),
                        'user_id' => $user->id,
                    ],
                );

                throw $e;
            }
        } else {
            Log::debug('Access token is still valid, skipping refresh', [
                'user_id' => $user->id,
            ]);
        }
    }
}
