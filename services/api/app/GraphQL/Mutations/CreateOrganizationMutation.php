<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationUserRole;
use App\Models\Organization;
use App\Services\InviteUserService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateOrganizationMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $organization = Organization::create([
            'name' => $args['name'],
        ]);

        $user = Auth::user();
        if (! $user) {
            throw new Error('User not found! you must be authenticated');
        }

        if (! $organization->id) {
            throw new Error('The organization could not be created');
        }

        InviteUserService::perform(
            $args['ownerEmail'] ?? $user->email,
            $args['ownerName']  ?? $user->name,
            $organization->id,
            OrganizationUserRole::Owner->value,
        );

        return Organization::find($organization->id);
    }
}
