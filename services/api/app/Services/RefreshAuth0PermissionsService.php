<?php

namespace App\Services;

use Auth0\SDK\Auth0;
use Auth0\SDK\Utility\Request\PaginatedRequest;
use Auth0\SDK\Utility\Request\RequestOptions;
use Illuminate\Support\Facades\Log;

class RefreshAuth0PermissionsService
{
    /**
     * Refreshes the database user permissions based on Auth0 user's role permissions.
     *
     * @param  User  $user  The User model instance.
     * @param  string  $auth0Id  The Auth0 ID of the user.
     * @return void
     */
    public static function perform($user, $auth0Id)
    {
        $auth0 = new Auth0([
            'domain'       => env('AUTH0_DOMAIN'),
            'clientId'     => env('AUTH0_MANAGEMENT_API_CLIENT_ID'),
            'clientSecret' => env('AUTH0_MANAGEMENT_API_SECRET'),
            'cookieSecret' => env('AUTH0_COOKIE_SECRET'),
            'audience'     => ['https://' . env('AUTH0_DOMAIN') . '/api/v2/'],
        ]);

        $management     = $auth0->management();
        $allPermissions = [];
        $page           = 0;
        $perPage        = 100;

        do {
            $response = $management
                ->users()
                ->getPermissions(
                    id: $auth0Id,
                    options: new RequestOptions(
                        pagination: new PaginatedRequest(
                            page: $page,
                            perPage: $perPage,
                        ),
                    ),
                );

            $decoded = json_decode($response->getBody()->getContents(), true);

            if (empty($decoded)) {
                break;
            }

            $allPermissions = array_merge($allPermissions, $decoded);
            $page++;
        } while (count($decoded) === $perPage);

        $userPermissions = array_values(
            array_unique(array_column($allPermissions, 'permission_name')),
        );

        Log::info(
            'LOGGER >>>>> permissions from refresh service: ',
            $userPermissions,
        );

        // Only update permissions, don't overwrite auth0_id or apple_auth0_id
        // The auth0_id and apple_auth0_id are managed by SignInUserMutation
        $user->permissions = $userPermissions;
        $user->save();
    }
}
