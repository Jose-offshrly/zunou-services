<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\HRAdminAgent;
use App\Services\MessageProcessingService;
use Illuminate\Support\Str;
use Tests\TestCase;

class HRAdminAgentTest extends TestCase
{
    public function test_hr_admin_agent_can_lookup_hr_info()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = 'bdd335e8-c852-47fb-b1a0-3c3a429d1f84';
        $uuid    = (string) Str::uuid();

        $user = User::findOrFail($userId);

        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();

        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test HR question Flow',
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
                'content' => 'how do i apply for maternity leave?',
            ],
        ]);

        $agent = new HRAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
    }
}
