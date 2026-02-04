<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationUserRole;
use App\Enums\OrganizationUserStatus;
use App\Models\OrganizationUser;
use App\Services\Auth0RoleService;
use Auth0\SDK\Auth0;
use GraphQL\Error\Error;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

readonly class AcceptInvitationMutation
{
    public function __invoke(null $_, array $args, GraphQLContext $context)
    {
        // create new instance of auth0
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
        $auth0Email = $tokenData['email'] ?? null;

        $managerRoleId = Config::get('auth0.roles.manager');
        $userRoleId    = Config::get('auth0.roles.user');
        $guestRoleId   = Config::get('auth0.roles.guest');

        // 1. read inviteCode passed from args
        $inviteCode = $args['inviteCode'] ?? null;

        // 2. fetch orgUser where invite_code === inviteCode
        $organizationUser = $this->fetchOrganizationUser($inviteCode);
        $user             = $organizationUser->user;

        if (
            !in_array(
                $organizationUser->status,
                [OrganizationUserStatus::Invited->value],
                true,
            )
        ) {
            throw new AuthenticationException(
                'This invite code has already been accepted',
            );
        }

        // Normalize email for comparison
        if ($auth0Email) {
            $auth0Email = strtolower(trim($auth0Email));
        }

        // If the Auth0 email differs from the user's email, update it
        // This handles cases where user signs in with Apple using a different email
        // but the invitation was sent to their original email
        if ($auth0Email && $user->email !== $auth0Email) {
            Log::info('Updating user email to match Auth0 email during invitation acceptance', [
                'user_id' => $user->id,
                'old_email' => $user->email,
                'new_email' => $auth0Email,
                'auth0_id' => $auth0Id,
                'invite_code' => $inviteCode,
            ]);
            
            $user->email = $auth0Email;
        }

        $roleId = match ($organizationUser->role) {
            OrganizationUserRole::Owner->value => $managerRoleId,
            OrganizationUserRole::User->value  => $userRoleId,
            OrganizationUserRole::Guest->value => $guestRoleId,
            default                            => null,
        };

        if ($roleId) {
            // 3. assign auth0 role
            $permissions = Auth0RoleService::addRole($auth0Id, $roleId);

            // Link the auth0_id to the user account
            $user->auth0_id = $auth0Id;
            // 4. save user permissions based on auth0 role added
            $user->permissions = $permissions;
            $user->save();
        } else {
            // Still link auth0_id even if no role
            $user->auth0_id = $auth0Id;
            $user->save();
        }

        $organizationUser->status = OrganizationUserStatus::Active;
        $organizationUser->save();

        return $user;
    }

    private function fetchOrganizationUser(
        ?string $inviteCode,
    ): OrganizationUser {
        Log::info(
            'LOGGER >>>>>>>>>> fetchOrganizationUser invite code: ' .
                $inviteCode,
        );

        if (empty($inviteCode)) {
            throw new AuthenticationException('Invite code is required');
        }

        $organizationUser = OrganizationUser::where([
            'invite_code' => $inviteCode,
        ])->first();

        if (!$organizationUser) {
            throw new AuthenticationException('Organization User not found');
        }

        return $organizationUser;
    }

    private function extractTokenFromContext(GraphQLContext $context): string
    {
        $authHeader = $context->request()->header('Authorization');

        if (empty($authHeader)) {
            throw new Error('No JWT was provided');
        }

        return str_replace('Bearer ', '', $authHeader);
    }
}
