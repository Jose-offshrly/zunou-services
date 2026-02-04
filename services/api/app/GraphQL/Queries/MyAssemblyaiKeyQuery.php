<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class MyAssemblyaiKeyQuery
{
    /**
     * Fetch the authenticated user's AssemblyAI API key.
     */
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo
    ): ?string {
        $user = Auth::user();

        if ($user instanceof User) {
            return $user->assemblyai_key;
        }

        return null;
    }
}
