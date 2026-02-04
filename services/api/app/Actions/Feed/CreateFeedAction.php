<?php

namespace App\Actions\Feed;

use App\DataTransferObjects\FeedData;
use App\Models\Feed;

class CreateFeedAction
{
    public function handle(FeedData $data): Feed
    {
        $feed = Feed::create([
            'content'         => $data->content,
            'user_id'         => $data->user_id,
            'pulse_id'        => $data->pulse_id,
            'organization_id' => $data->organization_id,
        ]);

        return $feed->refresh();
    }
}
