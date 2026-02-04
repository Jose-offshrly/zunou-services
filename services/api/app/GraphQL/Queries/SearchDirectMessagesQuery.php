<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessage;

final readonly class SearchDirectMessagesQuery
{
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;
        $query = trim($args['query'] ?? '');

        // Start building the base query
        $builder = DirectMessage::withTrashed()
            ->where('direct_message_thread_id', $args['directMessageThreadId'])
            ->with(['sender:id,name,picture']);

        // Apply search - use simple ILIKE on content text for reliability
        // This avoids JSON parsing errors on malformed content in the database
        if ($query !== '') {
            $escaped = str_replace(
                ['%', '_', '\\'],
                ['\\%', '\\_', '\\\\'],
                $query
            );
            $searchPattern = '%' . $escaped . '%';

            // Simple text search across all content
            // This will match the search term anywhere in the content field
            $builder->where('content', 'ILIKE', $searchPattern);
        }

        // Execute with ordering and pagination
        $messages = $builder
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', (int) $page);

        return [
            'threadId' => $args['directMessageThreadId'],
            'data' => $messages->items(),
            'paginatorInfo' => [
                'count' => $messages->count(),
                'currentPage' => $messages->currentPage(),
                'hasMorePages' => $messages->hasMorePages(),
                'lastPage' => $messages->lastPage(),
                'perPage' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ];
    }
}
