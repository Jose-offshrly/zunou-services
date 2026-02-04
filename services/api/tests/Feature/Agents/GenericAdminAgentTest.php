<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\GenericAdminAgent;
use App\Services\MessageProcessingService;
use Illuminate\Support\Str;
use Tests\TestCase;

class GenericAdminAgentTest extends TestCase
{
    public function test_generic_admin_agent_can_summarize_zunou_for_media_proposal_document()
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
            'name'            => 'Test Summary Flow',
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
                'content' => 'please summarize the Zunou for Media proposal document',
            ],
        ]);

        $agent = new GenericAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('zunou', $response);
    }

    public function test_generic_admin_agent_can_extract_feature_ideas_from_multiple_notes()
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
            'name'            => 'Test Feature Ideas from Notes',
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
                'content' => 'Please review Note A and Note B and give me a list of features we should build next for Pulse.',
            ],
        ]);

        $agent = new GenericAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('feature', $response);
        $this->assertStringContainsStringIgnoringCase('pulse', $response);
    }

    public function test_generic_admin_agent_can_summarize_latest_meeting()
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
            'name'            => 'Test Meeting Summary Flow',
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
                'content' => 'please summarize the latest meeting',
            ],
        ]);

        $agent = new GenericAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('summary', $response);
    }

    public function test_generic_admin_agent_can_summarize_catch_jobs_meeting()
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
            'name'            => 'Test Meeting Summary Flow',
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
                'content' => 'please summarize the catch jobs meeting',
            ],
        ]);

        $agent = new GenericAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('summary', $response);
    }

    public function test_generic_admin_agent_can_summarize_catch_jobs_meeting2()
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
            'name'            => 'Test Meeting Summary Flow',
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
                'content' => 'please summarize the catchjobs meeting',
            ],
        ]);

        $agent = new GenericAdminAgent($pulse);

        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        print_r($response);

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('summary', $response);
    }
}
