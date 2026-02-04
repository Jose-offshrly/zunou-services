<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Contact;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class ContactsQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $user = Auth::user();
        if (! $user instanceof User) {
            throw new Error('No user was found');
        }

        // Get the user ID from args or use authenticated user
        $userId = $args['userId'] ?? $user->id;
        $search = $args['search'] ?? null;

        // Build the query
        $query = Contact::query()
            ->whereHas('owners', function ($query) use ($userId) {
                $query->where('users.id', $userId);
            })
            ->when($search, function ($query, $search) {
                $searchTerm = '%' . strtolower($search) . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                      ->orWhereRaw('LOWER(email) LIKE ?', [$searchTerm]);
                });
            })
            ->orderBy('created_at', 'desc');

        // Handle pagination
        $perPage = $args['perPage'] ?? 10;
        $page    = $args['page']    ?? 1;

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}

