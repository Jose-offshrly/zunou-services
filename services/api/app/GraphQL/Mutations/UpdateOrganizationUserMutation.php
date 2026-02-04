<?php

namespace App\GraphQL\Mutations;

use App\Models\OrganizationUser;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UpdateOrganizationUserMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = isset($args['userId'])
            ? User::find($args['userId'])
            : Auth::user();

        if (! $user) {
            throw new Error('No user was found');
        }

        $organizationUser = OrganizationUser::where([
            'id'      => $args['organizationUserId'],
            'user_id' => $user->id,
        ])->firstOrFail();

        $updatableFields = [
            'job_title',
            'department',
            'profile',
            'job_description',
            'responsibilities',
        ];
        $updates = [];

        foreach ($updatableFields as $field) {
            $argKey = $this->toCamelCase($field);

            if (array_key_exists($argKey, $args)) {
                $updates[$field] = $args[$argKey];
            }
        }

        if (! empty($updates)) {
            $organizationUser->update($updates);

            return $organizationUser->refresh();
        }

        return $organizationUser;
    }

    private function toCamelCase(string $string): string
    {
        return lcfirst(str_replace('_', '', ucwords($string, '_')));
    }
}
