<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\DataSourceAgent;
use Illuminate\Support\Str;
use Tests\TestCase;

class DataSourceAgentTest extends TestCase
{
    public function test_data_source_agent_can_analyze_note_a_and_b()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user = User::findOrFail($userId);

        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();

        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test Note A + B Summary',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'dataSourceAgent',
            'is_active'       => true,
        ]);

        $messageText = 'Can you summarize the contents of Note A and Note B and suggest any improvements to our internal workflow?';
        //wrap in a Collection of chat messages
        $messages = collect([
            [
                'role'    => 'user',
                'content' => $messageText,
            ],
        ]);
        $agent = new DataSourceAgent($pulse);

        $response = $agent->processMessage(
            $messages,
            $thread,
            $user,
            $thread->id,
        );

        print_r($response);

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('note a', $response);
        $this->assertStringContainsStringIgnoringCase('note b', $response);
        $this->assertStringContainsStringIgnoringCase('improve', $response);
    }
}
