<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarRevokeMutation
{
    public function __invoke($_, array $args): array
    {
        try {
            $user = Auth::user();
            if (! $user) {
                Log::error(
                    'User not authenticated when revoking Google Calendar access',
                );
                throw new \Exception('User not authenticated');
            }

            Log::info('Revoking Google Calendar access for user', [
                'user_id'    => $user->id,
                'user_email' => $user->email,
                'auth0_id'   => $user->auth0_id,
            ]);

            // Revoke permissions
            if ($user->google_calendar_access_token) {
                $revokeSuccess = $this->revokeGoogleToken($user->google_calendar_access_token);
                
                if ($revokeSuccess) {
                    Log::info('Successfully revoked token with Google', [
                        'user_id' => $user->id,
                    ]);
                } else {
                    Log::warning('Failed to revoke token with Google, continuing anyway', [
                        'user_id' => $user->id,
                    ]);
                }
            }

            // Clear Google Calendar related fields from database
            $user->google_calendar_access_token  = null;
            $user->google_calendar_refresh_token = null;
            $user->google_calendar_email         = null;
            $user->google_calendar_linked        = false;
            $user->save();

            Log::info('Successfully revoked Google Calendar access for user', [
                'user_id'    => $user->id,
                'user_email' => $user->email,
            ]);

            return [
                'success' => true,
                'message' => 'Google Calendar access revoked successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to revoke Google Calendar access', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Revoke the token with Google's OAuth2 revocation endpoint
     */
    private function revokeGoogleToken(string $token): bool
    {
        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/revoke', [
                'token' => $token,
            ]);

            Log::info('Google token revocation response', [
                'status'     => $response->status(),
                'successful' => $response->successful(),
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('Error revoking Google token', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}