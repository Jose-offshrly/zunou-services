<?php

namespace Feature\Feed\Actions;

use App\Actions\Feed\CreateFeedAction;
use App\DataTransferObjects\FeedData;
use App\Models\Feed;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Tests\TestCase;

class CreateFeedActionTest extends TestCase
{
    public function test_it_creates_a_data_source_for_a_given_meeting()
    {
        $data = new FeedData(
            content: 'Crafting innovative campaigns',
            user_id: User::factory()->create()->id,
            pulse_id: Pulse::first()->id,
            organization_id: Organization::first()->id,
        );

        $action = app(CreateFeedAction::class);

        $feed = $action->handle(data: $data);

        $this->assertInstanceOf(Feed::class, $feed);

        $this->assertDatabaseHas(Feed::class, [
            'content'         => $data->content,
            'user_id'         => $data->user_id,
            'pulse_id'        => $data->pulse_id,
            'organization_id' => $data->organization_id,
        ]);
    }
}
