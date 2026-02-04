<?php

namespace App\GraphQL\Queries;

use App\Models\User;

class ValidateEmailsQuery
{
    public function __invoke($_, array $args)
    {
        $emails = $args['emails'];

        // Get users and their organizations
        $users = User::whereIn('email', $emails)
            ->with('organizations:id')
            ->get();

        return $users->map(function ($user) {
            return [
                'email'           => $user->email,
                'userId'          => $user->id,
                'organizationIds' => $user->organizations->pluck('id'),
            ];
        });
    }
}
