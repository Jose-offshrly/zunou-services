<?php

namespace App\Http\Middleware;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // API routes should never redirect - always return null to trigger JSON response
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }

        // For web routes, we don't have a login route, so return null
        // This will trigger the unauthenticated exception handler
        return null;
    }

    /**
     * Handle an unauthenticated user for API routes.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array  $guards
     * @return void
     *
     * @throws \Illuminate\Auth\AuthenticationException
     */
    protected function unauthenticated($request, array $guards)
    {
        throw new AuthenticationException(
            'Authentication required: Please log in again',
            $guards,
            $this->redirectTo($request)
        );
    }
}
