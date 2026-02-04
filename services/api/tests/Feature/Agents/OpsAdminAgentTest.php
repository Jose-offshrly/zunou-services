<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\OpsAdminAgent;
use App\Services\MessageProcessingService;
use Illuminate\Support\Str;
use Tests\TestCase;

class OpsAdminAgentTest extends TestCase
{
    public function test_ops_agent_can_scale_up_meet_bot()
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
            'name'            => 'OpsTest Summary Flow',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'adminAgent',
            'is_active'       => true,
        ]);

        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'please scale up the meet-bot service on dev to 2 instances',
            ],
        ]);

        $agent = new OpsAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        //$this->assertStringContainsStringIgnoringCase('zunou', $response);
    }

    public function test_ops_agent_can_scale_down_meet_bot()
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
            'name'            => 'OpsTest Summary Flow',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'adminAgent',
            'is_active'       => true,
        ]);

        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'please scale down the meet-bot service on dev to 1 instance',
            ],
        ]);

        $agent = new OpsAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        //$this->assertStringContainsStringIgnoringCase('zunou', $response);
    }
}
