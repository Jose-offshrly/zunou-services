<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessage;

final readonly class PinnedDirectMessagesQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;

        $directMessages = DirectMessage::where('is_pinned', true)
            ->where('direct_message_thread_id', $args['directMessageThreadId'])
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'threadId' => $args['directMessageThreadId'],
            'data' => $directMessages->items(),
            'paginatorInfo' => [
                'count' => $directMessages->count(),
                'currentPage' => $directMessages->currentPage(),
                'hasMorePages' => $directMessages->hasMorePages(),
                'lastPage' => $directMessages->lastPage(),
                'perPage' => $directMessages->perPage(),
                'total' => $directMessages->total(),
            ],
        ];
    }
}
