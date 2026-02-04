<?php

namespace Tests\Feature;

use App\Models\Thread;
use App\Services\Agents\SubAgents\OrgChartAgent;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrgChartAgentTest extends TestCase
{
    public function testAgentShouldAskConfirmationIfThereIsTypo()
    {
        $userId  = '9de646fb-614b-445d-8c93-cf1a35d6ce29';
        $pulseId = '2fd01c1f-c723-48f4-934e-5da345a5ebc1';

        $user  = \App\Models\User::findOrFail($userId);
        $pulse = \App\Models\Pulse::findOrFail($pulseId);

        $orgId = $pulse->organization_id;

        $thread = Thread::firstOrCreate(
            [
                'name'            => 'Test Org Chart Agent Thread',
                'organization_id' => $orgId,
                'pulse_id'        => $pulseId,
                'user_id'         => $userId,
                'type'            => 'orgChartAgent',
            ],
            [
                'third_party_id' => (string) Str::uuid(),
                'is_active'      => true,
            ],
        );

        $agent = new OrgChartAgent($pulse);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Give me JD of Jeroma',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );

        // dd($response);
        $this->assertIsString($response);
    }
}
