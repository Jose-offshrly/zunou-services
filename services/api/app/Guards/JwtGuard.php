<?php

namespace App\Guards;

use App\Models\User;
use Auth0\SDK\Auth0;
use Auth0\SDK\Exception\InvalidTokenException;
use Auth0\SDK\Token;
use GraphQL\Error\Error;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class JwtGuard implements Guard
{
    protected $user;
    protected $request;
    protected $provider;

    public function __construct(UserProvider $provider, Request $request)
    {
        $this->request  = $request;
        $this->provider = $provider;
        $this->authenticate();
    }

    public function authenticate()
    {
        $authHeader = $this->request->header('Authorization');

        if (empty($authHeader)) {
            return null;
        }

        $token = str_replace('Bearer ', '', $authHeader);

        if (! $token || $token === $authHeader) {
            return null;
        }

        try {
            // Auth0 configuration with clock skew tolerance
            $auth0 = new Auth0([
                'strategy'     => \Auth0\SDK\Configuration\SdkConfiguration::STRATEGY_API,
                'domain'       => env('AUTH0_DOMAIN'),
                'clientId'     => env('AUTH0_CLIENT_ID'),
                'clientSecret' => env('AUTH0_CLIENT_SECRET'),
                'cookieSecret' => env('AUTH0_COOKIE_SECRET'),
                'audience'     => [env('AUTH0_AUDIENCE')],
                'tokenLeeway'  => 60, // Allow 60 seconds clock skew tolerance
            ]);

            $decodedToken = $auth0->decode(
                $token,
                null,
                null,
                null,
                null,
                null,
                null,
                Token::TYPE_ACCESS_TOKEN,
            );

            if (! $decodedToken) {
                return null;
            }

            $auth0Id = $decodedToken->getSubject();

            if (! $auth0Id) {
                return null;
            }

            // Query the right column based on provider prefix to avoid OR (which kills index perf)
            if (str_starts_with($auth0Id, 'apple|')) {
                // Check apple_auth0_id first, fall back to auth0_id for legacy unmigrated users
                $user = User::where('apple_auth0_id', $auth0Id)->first()
                    ?? User::where('auth0_id', $auth0Id)->first();
            } else {
                $user = User::where('auth0_id', $auth0Id)->first();
            }

            if ($user) {
                // Set first_login_at if this is the user's first time logging in
                if ($user->isFirstTimeLogin()) {
                    $user->update(['first_login_at' => now()]);
                }
                
                $this->setUser($user);
                $this->request->attributes->add([
                    'user_auth0_id' => $auth0Id,
                ]);
            }
        } catch (InvalidTokenException $e) {
            // Handle common token issues more gracefully
            $errorMessage = $e->getMessage();

            // Check if it's a token expiration issue
            if (
                strpos($errorMessage, 'expired') !== false || strpos($errorMessage, 'exp') !== false
            ) {
                // Return null instead of throwing error for expired tokens
                // This allows the application to handle it gracefully (redirect to login)
                Log::info(
                    'JwtGuard: Token expired, allowing graceful handling',
                );
                return null;
            }

            // For other token issues, still throw error but with better message
            throw new Error('Authentication required: Please log in again');
        } catch (\Exception $e) {
            // Log actual error but don't expose internal details to client
            Log::error('JwtGuard: Authentication failed', [
                'error' => $e->getMessage(),
                'type'  => get_class($e),
            ]);

            throw new Error(
                'Authentication failed: Please try logging in again',
            );
        }
    }

    public function check()
    {
        return ! is_null($this->user);
    }

    public function guest()
    {
        return ! $this->check();
    }

    public function hasUser()
    {
        return $this->check();
    }

    public function user()
    {
        return $this->user;
    }

    public function id()
    {
        return $this->user() ? $this->user()->getAuthIdentifier() : null;
    }

    public function validate(array $credentials = [])
    {
        // Implement validation logic if necessary
        // This example does not use it since authentication is token-based
        throw new \Exception('Not implemented.');
    }

    public function setUser(\Illuminate\Contracts\Auth\Authenticatable $user)
    {
        $this->user = $user;
    }
}
