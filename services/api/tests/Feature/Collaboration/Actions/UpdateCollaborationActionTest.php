<?php

namespace Feature\Collaboration\Actions;

use App\Actions\Collaboration\UpdateCollaborationAction;
use App\DataTransferObjects\UpdateCollaborationData;
use App\Enums\CollaborationStatus;
use App\Models\Collaboration;
use Tests\TestCase;

class UpdateCollaborationActionTest extends TestCase
{
    public function test_it_can_update_a_collaboration_resource()
    {
        $collaboration = Collaboration::first();
        $data          = new UpdateCollaborationData(
            status: CollaborationStatus::ENDED->value,
        );

        $action = app(UpdateCollaborationAction::class);

        $collaboration = $action->handle(
            collaboration: $collaboration,
            data: $data,
        );

        $this->assertInstanceOf(Collaboration::class, $collaboration);
        $this->assertEquals('ended', $collaboration->status);
    }
}
