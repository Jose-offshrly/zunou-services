<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessage;
use App\Models\DirectMessageThread;
use Illuminate\Support\Facades\Auth;

final readonly class SearchDirectThreadMessagesQuery
{
    /**
     * @param array{organizationId:string, directMessageThreadId:string, page?:int, query:string, order?:string} $args
     * @return array{threadId: string|null, data: array<DirectMessage>, paginatorInfo: array{count: int, currentPage: int, firstItem: int|null, hasMorePages: bool, lastItem: int|null, lastPage: int, perPage: int, total: int}}
     */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;
        $order = strtolower($args['order'] ?? 'desc');
        $order = in_array($order, ['asc', 'desc'], true) ? $order : 'desc';
        $query = trim($args['query'] ?? '');
        $user = Auth::user();

        // Find the direct message thread by ID and validate organization
        $directMessageThread = DirectMessageThread::where('id', $args['directMessageThreadId'])
            ->where('organization_id', $args['organizationId'])
            ->first();

        if (!$directMessageThread) {
            return [
                'threadId' => null,
                'data' => [],
                'paginatorInfo' => [
                    'count' => 0,
                    'currentPage' => (int) $page,
                    'firstItem' => null,
                    'hasMorePages' => false,
                    'lastItem' => null,
                    'lastPage' => 1,
                    'perPage' => $perPage,
                    'total' => 0,
                ],
            ];
        }

        // Start building the base query
        $builder = DirectMessage::withTrashed()
            ->where('direct_message_thread_id', $directMessageThread->id)
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
            ->orderBy('created_at', $order)
            ->paginate($perPage, ['*'], 'page', (int) $page);

        return [
            'threadId' => $directMessageThread->id,
            'data' => $messages->items(),
            'paginatorInfo' => [
                'count' => $messages->count(),
                'currentPage' => $messages->currentPage(),
                'firstItem' => $messages->firstItem(),
                'hasMorePages' => $messages->hasMorePages(),
                'lastItem' => $messages->lastItem(),
                'lastPage' => $messages->lastPage(),
                'perPage' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ];
    }
}

