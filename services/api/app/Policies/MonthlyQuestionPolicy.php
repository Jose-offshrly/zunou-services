<?php

namespace App\Policies;

use App\Models\MonthlyQuestion;
use App\Models\User;

class MonthlyQuestionPolicy extends AbstractPolicy
{
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:monthlyQuestions') && $user->hasOrganization($args['organizationId']);
    }

    public function view(
        User $user,
        array $args,
        MonthlyQuestion $monthlyQuestion = null,
    ): bool {
        return $user->hasPermission('read:monthlyQuestions') && $user->hasOrganization($args['organizationId']);
    }

    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:monthlyQuestions') && $user->hasOrganization($args['organizationId']);
    }

    public function update(
        User $user,
        array $args,
        MonthlyQuestion $monthlyQuestion = null,
    ): bool {
        return $user->hasPermission('update:monthlyQuestions') && $user->hasOrganization($args['organizationId']);
    }

    public function delete(
        User $user,
        array $args,
        MonthlyQuestion $monthlyQuestion = null,
    ): bool {
        return $user->hasPermission('delete:monthlyQuestions') && $user->hasOrganization($args['organizationId']);
    }
}
