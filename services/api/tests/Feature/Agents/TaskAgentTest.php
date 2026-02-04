<?php

namespace Tests\Feature\Agents;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\SubAgents\TaskAgent;
use Illuminate\Support\Str;
use Tests\TestCase;

class TaskAgentTest extends TestCase
{
    /**
     * If the user asks to create a task without referencing a meeting,
     * we should get the generic confirmation.
     */
    public function test_task_agent_simple_task_creation()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = Str::uuid()->toString();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();
        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test Simple Task Creation',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'taskAgent',
            'is_active'       => true,
        ]);

        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'Please create a task to update the homepage banner, assign it to Marcus and have the due date be one week from now. There is no meeting to reference.',
            ],
        ]);

        $agent    = new TaskAgent($pulse);
        $response = $agent->processMessage(
            $messages,
            $thread,
            $user,
            Str::uuid()->toString(),
        );

        $this->assertStringContainsStringIgnoringCase(
            'has been created',
            $response,
        );
    }

    /**
     * If the user references the latest meeting, and we have a Meeting + Transcript,
     * then TaskAgent should invoke handleTaskCreationFromMeeting and return the success block.
     */
    public function test_task_agent_create_tasks_from_latest_meeting()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = Str::uuid()->toString();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();
        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test Tasks From Meeting',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'taskAgent',
            'is_active'       => true,
        ]);

        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'Create tasks for the latest meeting',
            ],
        ]);

        $agent    = new TaskAgent($pulse);
        $response = $agent->processMessage(
            $messages,
            $thread,
            $user,
            Str::uuid()->toString(),
        );

        $this->assertStringContainsStringIgnoringCase(
            'Success creating tasks',
            $response,
        );
        $this->assertStringContainsString(
            '<pre>',
            $response,
            'Should include the JSON dump in the hidden block',
        );
    }
}
