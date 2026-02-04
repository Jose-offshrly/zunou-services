<?php

namespace Feature\TeamThread;

use App\Actions\TeamMessage\DeleteTeamMessageAction;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DeleteTeamMessageActionTest extends TestCase
{
    public function test_it_deletes_a_team_message_owned_by_authenticated_user()
    {
        // Create test data
        $pulse        = Pulse::factory()->create();
        $organization = Organization::first();
        $user         = User::first();
        $teamThread   = TeamThread::factory()->create([
            'pulse_id'        => $pulse->id,
            'organization_id' => $organization->id,
        ]);

        // Create a team message
        $teamMessage = TeamMessage::factory()->create([
            'team_thread_id' => $teamThread->id,
            'content'        => 'Test message to be deleted',
            'user_id'        => $user->id,
        ]);

        // Mock authenticated user
        Auth::shouldReceive('id')
            ->once()
            ->andReturn($user->id);

        // Execute the action
        $action = app(DeleteTeamMessageAction::class);
        $result = $action->handle($teamMessage);

        // Assert the result is true (message was deleted)
        $this->assertTrue($result);

        // Assert the message no longer exists in the database
        $this->assertDatabaseMissing(TeamMessage::class, [
            'id' => $teamMessage->id,
        ]);
    }

    public function test_it_prevents_deletion_of_messages_owned_by_other_users()
    {
        // Create test data
        $pulse        = Pulse::factory()->create();
        $organization = Organization::first();
        $messageOwner = User::first();
        $otherUser    = User::factory()->create();
        $teamThread   = TeamThread::factory()->create([
            'pulse_id'        => $pulse->id,
            'organization_id' => $organization->id,
        ]);

        // Create a team message owned by messageOwner
        $teamMessage = TeamMessage::factory()->create([
            'team_thread_id' => $teamThread->id,
            'content'        => 'Message owned by another user',
            'user_id'        => $messageOwner->id,
        ]);

        // Mock authenticated user as otherUser
        Auth::shouldReceive('id')
            ->once()
            ->andReturn($otherUser->id);

        // Execute the action
        $action = app(DeleteTeamMessageAction::class);
        $result = $action->handle($teamMessage);

        // Assert the result is false (deletion failed)
        $this->assertFalse($result);

        // Assert the message still exists in the database
        $this->assertDatabaseHas(TeamMessage::class, [
            'id' => $teamMessage->id,
        ]);
    }

    public function test_it_handles_errors_gracefully()
    {
        // Create a non-existent team message ID
        $nonExistentId   = 'non-existent-id';
        $teamMessage     = new TeamMessage();
        $teamMessage->id = $nonExistentId;

        // Execute the action
        $action = app(DeleteTeamMessageAction::class);
        $result = $action->handle($teamMessage);

        // Assert the result is false (deletion failed)
        $this->assertFalse($result);
    }
}
