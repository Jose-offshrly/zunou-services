<?php

namespace App\GraphQL\Mutations;

use App\Actions\Summary\GenerateSummaryOptionsAction;
use App\Models\Message;
use App\Models\Summary;
use App\Models\Thread;

class CreateSummaryOptionsMutation
{
    public function __invoke($_, array $args): Message
    {
        $thread  = Thread::findOrFail($args['threadId']);
        $summary = Summary::findOrFail($args['summaryId']);

        $generateSummaryOptionsAction = new GenerateSummaryOptionsAction(
            summary: $summary,
            thread: $thread,
        );

        return $generateSummaryOptionsAction->handle();
    }
}
