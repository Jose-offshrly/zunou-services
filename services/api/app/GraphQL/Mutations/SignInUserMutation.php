<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationUserRole;
use App\Enums\OrganizationUserStatus;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Services\Auth0RoleService;
use App\Services\PersonalPulseService;
use App\Services\RefreshAuth0PermissionsService;
use Auth0\SDK\Auth0;
use GraphQL\Error\Error;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

final readonly class SignInUserMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args, GraphQLContext $context)
    {
        $managerRoleId = Config::get('auth0.roles.manager');
        $userRoleId    = Config::get('auth0.roles.user');
        $guestRoleId   = Config::get('auth0.roles.guest');

        $auth0 = new Auth0([
            'domain'       => env('AUTH0_DOMAIN'),
            'clientId'     => env('AUTH0_CLIENT_ID'),
            'clientSecret' => env('AUTH0_CLIENT_SECRET'),
            'cookieSecret' => env('AUTH0_COOKIE_SECRET'),
            'audience'     => [env('AUTH0_AUDIENCE')],
        ]);

        $token        = $this->extractTokenFromContext($context);
        $decodedToken = $auth0->decode($token);
        $auth0Id      = $decodedToken->getSubject();

        $tokenData = $decodedToken->toArray();
        $email     = $tokenData['email'] ?? null;

        // Get provider from input if provided, otherwise detect from auth0Id or token
        $input    = $args['input']     ?? [];
        $provider = $input['provider'] ?? null;

        if (! $provider) {
            // Fast detection from auth0Id format (no API call needed)
            $provider = $this->detectProviderFromAuth0Id($auth0Id);
        }

        // Log token data for debugging iOS issues (remove sensitive data in production)
        Log::info('SignInUserMutation: Token data received', [
            'auth0_id'        => $auth0Id,
            'email_in_token'  => $email,
            'provider'        => $provider,
            'provider_source' => isset($input['provider']) ? 'input' : 'detected',
            'token_keys'      => array_keys($tokenData),
        ]);

        // If email is not in token, try to fetch from Auth0 Management API (common on iOS)
        if (! $email) {
            Log::warning('SignInUserMutation: No email in token, fetching from Auth0', [
                'auth0_id' => $auth0Id,
            ]);

            try {
                $email = $this->fetchEmailFromAuth0($auth0Id);

                if ($email) {
                    Log::info('SignInUserMutation: Email fetched from Auth0', [
                        'auth0_id' => $auth0Id,
                        'email'    => $email,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('SignInUserMutation: Failed to fetch email from Auth0', [
                    'auth0_id' => $auth0Id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        if (! $email) {
            throw new AuthenticationException('No email was provided');
        }

        // Normalize email to lowercase for consistent matching
        $email = strtolower(trim($email));

        Log::info('SignInUserMutation: Looking for user', [
            'auth0_id'         => $auth0Id,
            'email_from_token' => $email,
        ]);

        // First, try to find user by email (this links Google and Apple accounts)
        $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])
            ->whereHas('organizationUsers') // Prioritize users with organizations
            ->first();

        $auth0IdForPermissions = null;

        if ($user) {
            Log::info('SignInUserMutation: Found user by email (account linking)', [
                'user_id'         => $user->id,
                'email'           => $user->email,
                'provider'        => $provider,
                'google_auth0_id' => $user->auth0_id,
                'apple_auth0_id'  => $user->apple_auth0_id,
                'new_auth0_id'    => $auth0Id,
            ]);

            // Link provider-specific ID based on detected provider
            if ($provider === 'apple') {
                // Apple sign-in (iOS): store in apple_auth0_id
                // If auth0_id contains Apple ID (user created with Apple first), move it to apple_auth0_id
                if ($user->auth0_id && str_starts_with($user->auth0_id, 'apple|') && ! $user->apple_auth0_id) {
                    Log::info('SignInUserMutation: Moving Apple ID from auth0_id to apple_auth0_id', [
                        'user_id'      => $user->id,
                        'old_auth0_id' => $user->auth0_id,
                    ]);
                    $user->apple_auth0_id = $user->auth0_id;
                    $user->auth0_id       = null; // Clear auth0_id, will be set when Google signs in
                    $user->save();
                }

                if (! $user->apple_auth0_id) {
                    Log::info('SignInUserMutation: Linking Apple identity to existing account', [
                        'user_id'        => $user->id,
                        'apple_auth0_id' => $auth0Id,
                    ]);
                    $user->apple_auth0_id = $auth0Id;
                    $user->save();
                }
                // Use Google auth0_id for permissions (primary), fallback to Apple if no Google
                $auth0IdForPermissions = $user->auth0_id ?? $user->apple_auth0_id ?? $auth0Id;
            } else {
                // Google sign-in (Web/Android/iOS): store in auth0_id (primary)
                // If auth0_id contains Apple ID (user created with Apple first), move it to apple_auth0_id
                if ($user->auth0_id && str_starts_with($user->auth0_id, 'apple|')) {
                    Log::info('SignInUserMutation: Moving Apple ID to apple_auth0_id, setting Google auth0_id', [
                        'user_id'            => $user->id,
                        'old_auth0_id'       => $user->auth0_id,
                        'new_apple_auth0_id' => $user->auth0_id,
                        'new_auth0_id'       => $auth0Id,
                    ]);
                    $user->apple_auth0_id = $user->auth0_id;
                    $user->auth0_id       = $auth0Id;
                    $user->save();
                } elseif (! $user->auth0_id) {
                    Log::info('SignInUserMutation: Setting primary Google auth0_id', [
                        'user_id'  => $user->id,
                        'auth0_id' => $auth0Id,
                    ]);
                    $user->auth0_id = $auth0Id;
                    $user->save();
                }
                $auth0IdForPermissions = $user->auth0_id;
            }
        } else {
            // Fallback: find any user with this email (without organization data)
            $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])
                ->first();

            if ($user) {
                Log::warning('SignInUserMutation: User found but has no OrganizationUser data', [
                    'user_id'        => $user->id,
                    'email'          => $user->email,
                    'auth0_id'       => $user->auth0_id,
                    'apple_auth0_id' => $user->apple_auth0_id,
                ]);

                // Same provider-specific linking logic
                if ($provider === 'apple') {
                    // If auth0_id contains Apple ID, move it to apple_auth0_id
                    if ($user->auth0_id && str_starts_with($user->auth0_id, 'apple|') && ! $user->apple_auth0_id) {
                        $user->apple_auth0_id = $user->auth0_id;
                        $user->auth0_id       = null;
                        $user->save();
                    }
                    if (! $user->apple_auth0_id) {
                        $user->apple_auth0_id = $auth0Id;
                        $user->save();
                    }
                    $auth0IdForPermissions = $user->auth0_id ?? $user->apple_auth0_id ?? $auth0Id;
                } else {
                    // Google sign-in
                    if ($user->auth0_id && str_starts_with($user->auth0_id, 'apple|')) {
                        $user->apple_auth0_id = $user->auth0_id;
                        $user->auth0_id       = $auth0Id;
                        $user->save();
                    } elseif (! $user->auth0_id) {
                        $user->auth0_id = $auth0Id;
                        $user->save();
                    }
                    $auth0IdForPermissions = $user->auth0_id;
                }
            }
        }

        // If not found by email, try to find by auth0_id (Google) or apple_auth0_id (Apple)
        if (! $user) {
            $user = User::where('auth0_id', $auth0Id)->first();

            if (! $user) {
                $user = User::where('apple_auth0_id', $auth0Id)->first();
            }

            if ($user) {
                Log::info('SignInUserMutation: Found user by auth0_id', [
                    'user_id'                 => $user->id,
                    'auth0_id'                => $auth0Id,
                    'db_email'                => $user->email,
                    'provider'                => $provider,
                    'existing_auth0_id'       => $user->auth0_id,
                    'existing_apple_auth0_id' => $user->apple_auth0_id,
                ]);

                // Handle case where user was created with Apple first (auth0_id contains Apple ID)
                if ($provider === 'apple') {
                    // If auth0_id contains Apple ID (starts with "apple|"), move it to apple_auth0_id
                    if ($user->auth0_id && str_starts_with($user->auth0_id, 'apple|') && ! $user->apple_auth0_id) {
                        Log::info('SignInUserMutation: Moving Apple ID from auth0_id to apple_auth0_id', [
                            'user_id'            => $user->id,
                            'old_auth0_id'       => $user->auth0_id,
                            'new_apple_auth0_id' => $user->auth0_id,
                        ]);
                        $user->apple_auth0_id = $user->auth0_id;
                        $user->auth0_id       = null; // Clear auth0_id, will be set when Google signs in
                        $user->save();
                    } elseif (! $user->apple_auth0_id) {
                        // If apple_auth0_id is not set, set it
                        $user->apple_auth0_id = $auth0Id;
                        $user->save();
                    }
                    $auth0IdForPermissions = $user->auth0_id ?? $user->apple_auth0_id ?? $auth0Id;
                } else {
                    // Google sign-in
                    if ($user->auth0_id && str_starts_with($user->auth0_id, 'apple|')) {
                        // If auth0_id contains Apple ID, move it to apple_auth0_id and set Google
                        Log::info('SignInUserMutation: Moving Apple ID to apple_auth0_id, setting Google auth0_id', [
                            'user_id'            => $user->id,
                            'old_auth0_id'       => $user->auth0_id,
                            'new_apple_auth0_id' => $user->auth0_id,
                            'new_auth0_id'       => $auth0Id,
                        ]);
                        $user->apple_auth0_id = $user->auth0_id;
                        $user->auth0_id       = $auth0Id;
                        $user->save();
                    } elseif (! $user->auth0_id) {
                        $user->auth0_id = $auth0Id;
                        $user->save();
                    }
                    $auth0IdForPermissions = $user->auth0_id;
                }

                // Update email if needed
                if (strtolower(trim($user->email)) !== $email) {
                    Log::info('SignInUserMutation: Updating user email to match Auth0', [
                        'user_id'   => $user->id,
                        'old_email' => $user->email,
                        'new_email' => $email,
                        'auth0_id'  => $auth0Id,
                    ]);

                    $user->email = $email;
                    $user->save();
                }
            }
        }

        if (! $user) {
            // Debug: Check if user exists with similar email
            $emailPrefix   = explode('@', $email)[0] ?? '';
            $existingUsers = User::where('email', 'like', '%'.$emailPrefix.'%')
                ->limit(5)
                ->get(['id', 'email', 'auth0_id', 'name']);

            Log::warning('SignInUserMutation: User not found', [
                'auth0_id'                          => $auth0Id,
                'email'                             => $email,
                'existing_users_with_similar_email' => $existingUsers->toArray(),
            ]);

            throw new AuthenticationException('User not found');
        }

        // Log detailed user information for debugging
        $organizationUserCount = OrganizationUser::where('user_id', $user->id)->count();

        Log::info('SignInUserMutation: User found', [
            'user_id'                  => $user->id,
            'email'                    => $user->email,
            'provider'                 => $provider,
            'auth0_id'                 => $auth0Id,
            'google_auth0_id'          => $user->auth0_id,
            'apple_auth0_id'           => $user->apple_auth0_id,
            'auth0_id_for_permissions' => $auth0IdForPermissions ?? $auth0Id,
            'organization_user_count'  => $organizationUserCount,
            'has_organizations'        => $organizationUserCount > 0,
        ]);

        // Fix: Check if OrganizationUser exists before accessing it
        $organizationUser = OrganizationUser::where('user_id', $user->id)->first();

        if ($organizationUser) {
            if ($organizationUser->status === OrganizationUserStatus::Invited->value) {
                $organizationUser->status = OrganizationUserStatus::Active->value;
                $organizationUser->save();
            }

            $roleId = match ($organizationUser->role) {
                OrganizationUserRole::Owner->value => $managerRoleId,
                OrganizationUserRole::User->value  => $userRoleId,
                OrganizationUserRole::Guest->value => $guestRoleId,
                default                            => null,
            };
        } else {
            // Log warning if user exists but has no organization
            Log::warning('SignInUserMutation: User found but has no OrganizationUser', [
                'user_id'  => $user->id,
                'email'    => $user->email,
                'auth0_id' => $auth0Id,
            ]);

            // Set default role or handle appropriately
            $roleId = $userRoleId; // Default to user role
        }
        if ($user->isFirstTimeLogin()) {
            $user->update([
                'first_login_at' => now(),
            ]);
            $user->refresh();
        }

        // Use the appropriate auth0_id for permissions
        $finalAuth0Id = $auth0IdForPermissions ?? $auth0Id;

        $permissions = Auth0RoleService::addRole($finalAuth0Id, $roleId);

        // Update permissions (don't overwrite auth0_id or apple_auth0_id as they're already set above)
        $user->update([
            'permissions' => json_encode($permissions),
        ]);

        $user->refresh();

        RefreshAuth0PermissionsService::perform($user, $finalAuth0Id);

        $this->ensureUserHasPersonalPulses(user: $user);

        return $user;
    }

    private function fetchEmailFromAuth0(string $auth0Id): ?string
    {
        try {
            $domain       = env('AUTH0_DOMAIN');
            $clientId     = env('AUTH0_MANAGEMENT_API_CLIENT_ID');
            $clientSecret = env('AUTH0_MANAGEMENT_API_SECRET');

            if (! $clientId || ! $clientSecret) {
                Log::warning('SignInUserMutation: Auth0 Management API credentials not configured');

                return null;
            }

            // Get management API token
            $tokenResponse = Http::asForm()->post(
                "https://{$domain}/oauth/token",
                [
                    'grant_type'    => 'client_credentials',
                    'client_id'     => $clientId,
                    'client_secret' => $clientSecret,
                    'audience'      => "https://{$domain}/api/v2/",
                ],
            );

            if (! $tokenResponse->successful()) {
                Log::error('SignInUserMutation: Failed to get management token', [
                    'status' => $tokenResponse->status(),
                ]);

                return null;
            }

            $managementToken = $tokenResponse->json()['access_token'] ?? null;

            if (! $managementToken) {
                return null;
            }

            // Fetch user profile
            $userResponse = Http::withToken($managementToken)
                ->get("https://{$domain}/api/v2/users/{$auth0Id}");

            if (! $userResponse->successful()) {
                Log::error('SignInUserMutation: Failed to fetch user from Auth0', [
                    'status' => $userResponse->status(),
                ]);

                return null;
            }

            $userProfile = $userResponse->json();
            $email       = $userProfile['email'] ?? null;

            // Check identities for email if main email is null
            if (! $email && isset($userProfile['identities'])) {
                foreach ($userProfile['identities'] as $identity) {
                    if (isset($identity['profileData']['email'])) {
                        $email = $identity['profileData']['email'];
                        break;
                    }
                }
            }

            return $email ? strtolower(trim($email)) : null;
        } catch (\Exception $e) {
            Log::error('SignInUserMutation: Exception fetching email from Auth0', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Fast provider detection from Auth0 ID format (no API call needed)
     * Apple: "apple|001458..."
     * Google: "google-oauth2|..."
     */
    private function detectProviderFromAuth0Id(string $auth0Id): string
    {
        if (str_starts_with($auth0Id, 'apple|')) {
            return 'apple';
        }

        if (str_starts_with($auth0Id, 'google-oauth2|')) {
            return 'google';
        }

        // Fallback to API-based detection for other providers
        Log::warning('SignInUserMutation: Unknown provider format, using API detection', [
            'auth0_id' => $auth0Id,
        ]);

        return $this->detectProvider($auth0Id);
    }

    /**
     * Fallback provider detection using Auth0 Management API
     * Only used when provider cannot be detected from auth0Id format
     */
    private function detectProvider(string $auth0Id): string
    {
        try {
            $domain       = env('AUTH0_DOMAIN');
            $clientId     = env('AUTH0_MANAGEMENT_API_CLIENT_ID');
            $clientSecret = env('AUTH0_MANAGEMENT_API_SECRET');

            if (! $clientId || ! $clientSecret) {
                return 'google'; // Default to Google (most common)
            }

            // Get management API token
            $tokenResponse = Http::asForm()->post(
                "https://{$domain}/oauth/token",
                [
                    'grant_type'    => 'client_credentials',
                    'client_id'     => $clientId,
                    'client_secret' => $clientSecret,
                    'audience'      => "https://{$domain}/api/v2/",
                ],
            );

            if (! $tokenResponse->successful()) {
                return 'google';
            }

            $managementToken = $tokenResponse->json()['access_token'] ?? null;
            if (! $managementToken) {
                return 'google';
            }

            // Fetch user profile
            $userResponse = Http::withToken($managementToken)
                ->get("https://{$domain}/api/v2/users/{$auth0Id}");

            if (! $userResponse->successful()) {
                return 'google';
            }

            $userProfile = $userResponse->json();
            $identities  = $userProfile['identities'] ?? [];

            // Check identities - Apple will have provider 'apple'
            foreach ($identities as $identity) {
                $provider = $identity['provider'] ?? '';
                if ($provider === 'apple') {
                    return 'apple';
                }
            }

            // Default to Google (Web/Android/iOS with Google)
            return 'google';
        } catch (\Exception $e) {
            Log::error('SignInUserMutation: Failed to detect provider', [
                'auth0_id' => $auth0Id,
                'error'    => $e->getMessage(),
            ]);

            return 'google'; // Default to Google
        }
    }

    private function extractTokenFromContext(GraphQLContext $context): string
    {
        $authHeader = $context->request()->header('Authorization');

        if (empty($authHeader)) {
            throw new Error('No JWT was provided');
        }

        return str_replace('Bearer ', '', $authHeader);
    }

    public function ensureUserHasPersonalPulses(User $user): void
    {
        Log::info("Processing personal pulse check job for user {$user->id}");

        $organizationIds = $user->organizationIds();

        Log::info(
            "Checking personal pulses for user {$user->id} across ".
                count($organizationIds).
                ' organizations',
        );

        foreach ($organizationIds as $organizationId) {
            PersonalPulseService::ensureUserHasPersonalPulse(
                $user,
                $organizationId,
            );
        }

        Log::info("Completed personal pulse check job for user {$user->id}");
    }
}
