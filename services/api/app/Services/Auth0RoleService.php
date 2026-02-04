<?php

namespace App\Services;

use Auth0\SDK\Auth0;
use Auth0\SDK\Utility\Request\PaginatedRequest;
use Auth0\SDK\Utility\Request\RequestOptions;

class Auth0RoleService
{
    /**
     * Assigns a new role to an Auth0 user and returns the role's permissions.
     *
     * @param  string  $auth0Id  The Auth0 user ID.
     * @param  string  $roleId  The ID of the role to assign.
     * @return array The set of permissions associated with the assigned role.
     *
     * @throws Exception If no role is found that matches the given role name.
     */
    public static function addRole($auth0Id, $roleId)
    {
        $auth0 = new Auth0([
            'domain'       => env('AUTH0_DOMAIN'),
            'clientId'     => env('AUTH0_MANAGEMENT_API_CLIENT_ID'),
            'clientSecret' => env('AUTH0_MANAGEMENT_API_SECRET'),
            'cookieSecret' => env('AUTH0_COOKIE_SECRET'),
            'audience'     => ['https://' . env('AUTH0_DOMAIN') . '/api/v2/'],
        ]);

        $management = $auth0->management();

        // Step 1: Validate if roleId exists in Auth0
        try {
            $management->roles()->get($roleId);
        } catch (\Exception $e) {
            return null;
        }

        // Step 2: assign the role to the user in Auth0
        try {
            $management->users()->addRoles($auth0Id, [$roleId]);

            // Get the user's permissions
            $response = $management
                ->roles()
                ->getPermissions(
                    $roleId,
                    new RequestOptions(
                        pagination: new PaginatedRequest(perPage: 100),
                    ),
                );

            // Decode the JSON body
            $body = json_decode($response->getBody()->getContents(), true);

            \Log::info('LOGGER >>>>> permissions from roleId: ', $body);

            // Extract permission names
            return array_map(fn ($perm) => $perm['permission_name'], $body);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Replaces all current roles with a new role and returns the permissions.
     *
     * @param  string  $auth0Id  The Auth0 user ID.
     * @param  string  $newRoleId  The ID of the new role to assign.
     * @return array|null The set of permissions associated with the new role.
     */
    public static function replaceRoles($auth0Id, $newRoleId)
    {
        $auth0 = new Auth0([
            'domain'       => env('AUTH0_DOMAIN'),
            'clientId'     => env('AUTH0_MANAGEMENT_API_CLIENT_ID'),
            'clientSecret' => env('AUTH0_MANAGEMENT_API_SECRET'),
            'cookieSecret' => env('AUTH0_COOKIE_SECRET'),
            'audience'     => ['https://' . env('AUTH0_DOMAIN') . '/api/v2/'],
        ]);

        $management = $auth0->management();

        try {
            $rolesResponse = $management->users()->getRoles($auth0Id);
            $currentRoles = json_decode($rolesResponse->getBody()->getContents(), true);
            
            if (!empty($currentRoles)) {
                $currentRoleIds = array_column($currentRoles, 'id');
                $management->users()->removeRoles($auth0Id, $currentRoleIds);
            }

            return self::addRole($auth0Id, $newRoleId);

        } catch (\Exception $e) {
            \Log::error('Failed to replace user roles', [
                'auth0_id' => $auth0Id,
                'new_role_id' => $newRoleId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
