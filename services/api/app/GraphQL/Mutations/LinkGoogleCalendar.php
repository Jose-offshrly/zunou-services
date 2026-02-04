<?php

namespace App\GraphQL\Mutations;

use App\Jobs\SetupUserGoogleCalendarWebhookJob;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LinkGoogleCalendar
{
    private const REQUIRED_SCOPES = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    public function __invoke($_, array $args)
    {
        try {
            $managementToken = $this->getManagementToken();

            if (! $managementToken) {
                return [
                    'success' => false,
                    'message' => 'Failed to retrieve management token',
                ];
            }

            $auth0UserId = Auth::user()?->auth0_id;

            if (! $auth0UserId) {
                return [
                    'success' => false,
                    'message' => 'Missing Auth0 user ID',
                ];
            }

            $domain   = config('services.auth0.domain');
            $response = Http::withToken($managementToken)->get(
                "https://$domain/api/v2/users/{$auth0UserId}",
            );

            // Log Auth0 user fetch response
            Log::info('Auth0 user fetch response', [
                'user_id'    => $auth0UserId,
                'status'     => $response->status(),
                'successful' => $response->successful(),
                'body'       => $response->body(),
            ]);

            if (! $response->successful()) {
                Log::error('Failed to fetch Auth0 user', [
                    'user_id' => $auth0UserId,
                    'status'  => $response->status(),
                    'body'    => $response->body(),
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to fetch Auth0 user: '.$response->body(),
                ];
            }

            $userProfile = $response->json();

            // Log user profile data (excluding sensitive tokens for security)
            Log::info('Auth0 user profile received', [
                'user_id'             => $auth0UserId,
                'email'               => $userProfile['email'] ?? null,
                'identities_count'    => count($userProfile['identities'] ?? []),
                'has_google_identity' => ! empty(collect($userProfile['identities'] ?? [])->firstWhere('provider', 'google-oauth2')),
            ]);

            $googleIdentity = collect(
                $userProfile['identities'] ?? [],
            )->firstWhere('provider', 'google-oauth2');

            if ($googleIdentity) {
                Log::info('Google identity found', [
                    'user_id'           => $auth0UserId,
                    'provider'          => $googleIdentity['provider']   ?? null,
                    'user_id_google'    => $googleIdentity['user_id']    ?? null,
                    'connection'        => $googleIdentity['connection'] ?? null,
                    'has_refresh_token' => ! empty($googleIdentity['refresh_token'] ?? null),
                    'has_access_token'  => ! empty($googleIdentity['access_token'] ?? null),
                ]);
            } else {
                Log::warning('No Google identity found in user profile', [
                    'user_id'             => $auth0UserId,
                    'available_providers' => collect($userProfile['identities'] ?? [])->pluck('provider')->toArray(),
                ]);

                return [
                    'success' => false,
                    'message' => 'Please try again and accept all permissions.',
                ];
            }

            $refreshToken = $googleIdentity['refresh_token'] ?? null; // Google only provides a refresh token if offline access was granted
            $accessToken  = $googleIdentity['access_token']   ?? null;

            if (! $refreshToken || ! $accessToken) {
                Log::error('Missing Google OAuth tokens', [
                    'user_id'                => $auth0UserId,
                    'has_refresh_token'      => ! empty($refreshToken),
                    'has_access_token'       => ! empty($accessToken),
                    'google_identity_exists' => ! empty($googleIdentity),
                ]);

                return [
                    'success' => false,
                    'message' => 'Please try again and accept all permissions including offline access.',
                ];
            }

            // Verify granted scopes and get token expiration info
            $scopeVerification = $this->verifyGoogleScopes($accessToken);

            if (! $scopeVerification['success']) {
                Log::error('Insufficient Google Calendar scopes', [
                    'user_id'        => $auth0UserId,
                    'granted_scopes' => $scopeVerification['granted'] ?? [],
                    'missing_scopes' => $scopeVerification['missing'] ?? [],
                ]);

                return [
                    'success' => false,
                    'message' => 'Required calendar permissions were not granted.',
                ];
            }

            Log::info('Google Calendar scopes verified', [
                'user_id'        => $auth0UserId,
                'granted_scopes' => $scopeVerification['granted'] ?? [],
            ]);

            // Calculate expiration time from expires_in (seconds)
            $expiresIn = $scopeVerification['expires_in'] ?? 3600; // Default to 1 hour if not provided
            $expiresAt = now()->addSeconds($expiresIn);

            // Save the Google Calendar email and tokens to the User model
            $user = Auth::user();
            if ($user) {
                $email = $args['email'] ?? $userProfile['email'];

                Log::info('Saving Google Calendar tokens to user', [
                    'user_id'           => $user->id,
                    'auth0_user_id'     => $auth0UserId,
                    'email'             => $email,
                    'has_access_token'  => ! empty($accessToken),
                    'has_refresh_token' => ! empty($refreshToken),
                    'expires_in'        => $expiresIn,
                    'expires_at'        => $expiresAt->toIso8601String(),
                ]);

                $user->google_calendar_email         = $email;
                $user->google_calendar_access_token  = $accessToken;
                $user->google_calendar_refresh_token = $refreshToken;
                $user->google_calendar_expires_at    = $expiresAt;
                $user->google_calendar_linked        = true;
                $user->save();

                Log::info('Google Calendar tokens saved successfully', [
                    'user_id'                => $user->id,
                    'auth0_user_id'          => $auth0UserId,
                    'google_calendar_linked' => $user->google_calendar_linked,
                ]);

                // Setup Google Calendar webhook for the user
                SetupUserGoogleCalendarWebhookJob::dispatch($user, true);
            } else {
                Log::error('User not found during Google Calendar linking', [
                    'auth0_user_id' => $auth0UserId,
                ]);
            }

            return [
                'success' => true,
                'message' => 'Google Calendar linked successfully',
            ];
        } catch (\Throwable $e) {
            Log::error('LinkGoogleCalendar failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Exception: '.$e->getMessage(),
            ];
        }
    }

    private function verifyGoogleScopes(string $accessToken): array
    {
        try {
            // Use Google's tokeninfo endpoint to verify the token and get granted scopes
            $response = Http::get('https://www.googleapis.com/oauth2/v1/tokeninfo', [
                'access_token' => $accessToken,
            ]);

            if (! $response->successful()) {
                Log::error('Failed to verify Google token', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return [
                    'success'    => false,
                    'granted'    => [],
                    'missing'    => self::REQUIRED_SCOPES,
                    'expires_in' => null,
                ];
            }

            $tokenInfo           = $response->json();
            $grantedScopesString = $tokenInfo['scope'] ?? '';
            $grantedScopes       = explode(' ', $grantedScopesString);
            $expiresIn           = $tokenInfo['expires_in'] ?? null; // Seconds until expiration

            // Check which required scopes are missing
            $missingScopes = array_filter(self::REQUIRED_SCOPES, function ($requiredScope) use ($grantedScopes) {
                return ! in_array($requiredScope, $grantedScopes);
            });

            Log::info('Google scope verification result', [
                'granted_scopes' => $grantedScopes,
                'missing_scopes' => array_values($missingScopes),
                'all_granted'    => empty($missingScopes),
                'expires_in'     => $expiresIn,
            ]);

            return [
                'success'    => empty($missingScopes),
                'granted'    => $grantedScopes,
                'missing'    => array_values($missingScopes),
                'expires_in' => $expiresIn,
            ];
        } catch (\Throwable $e) {
            Log::error('Error verifying Google scopes', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success'    => false,
                'granted'    => [],
                'missing'    => self::REQUIRED_SCOPES,
                'expires_in' => null,
            ];
        }
    }

    private function getManagementToken(): ?string
    {
        $domain       = config('services.auth0.domain');
        $clientId     = config('services.auth0.mgmt_client_id');
        $clientSecret = config('services.auth0.mgmt_client_secret');

        $response = Http::asForm()->post("https://$domain/oauth/token", [
            'grant_type'    => 'client_credentials',
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
            'audience'      => "https://$domain/api/v2/",
        ]);

        Log::info('Auth0 management token request', [
            'domain'     => $domain,
            'client_id'  => $clientId,
            'status'     => $response->status(),
            'successful' => $response->successful(),
        ]);

        if ($response->successful()) {
            $tokenData = $response->json();
            Log::info('Auth0 management token obtained successfully', [
                'token_type'       => $tokenData['token_type'] ?? null,
                'expires_in'       => $tokenData['expires_in'] ?? null,
                'has_access_token' => ! empty($tokenData['access_token'] ?? null),
            ]);

            return $tokenData['access_token'];
        }

        Log::error('Failed to get Auth0 management token', [
            'domain'    => $domain,
            'client_id' => $clientId,
            'status'    => $response->status(),
            'body'      => $response->body(),
        ]);

        return null;
    }
}
