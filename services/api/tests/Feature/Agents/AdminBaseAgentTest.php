<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\AdminBaseAgent;
use App\Services\MessageProcessingService;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminBaseAgentTest extends TestCase
{
    public function test_admin_agent_can_summarize_zunou_for_media_proposal_document()
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

        $agent = new AdminBaseAgent($pulse);

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

    public function test_admin_agent_can_extract_feature_ideas_from_multiple_notes()
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

        $agent = new AdminBaseAgent($pulse);

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

    public function test_admin_agent_can_summarize_latest_meeting()
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

        $agent = new AdminBaseAgent($pulse);

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

    public function test_admin_agent_can_summarize_catch_jobs_meeting()
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

        $agent = new AdminBaseAgent($pulse);

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

    public function test_admin_agent_can_summarize_catch_jobs_meeting2()
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

        $agent = new AdminBaseAgent($pulse);

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

    public function test_admin_agent_can_list_pull_requests()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();
        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test List PRs Flow',
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
                'content' => 'can you give me a list of pull requests please',
            ],
        ]);

        $agent    = new AdminBaseAgent($pulse);
        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase(
            'pull request',
            $response,
        );
    }

    public function test_admin_agent_can_list_pull_requests_with_repo_info()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();
        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test List PRs w/ Repo',
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
                'content' => 'List pull requests for owner "77brainz" and repo "zunou-services"',
            ],
        ]);

        $agent    = new AdminBaseAgent($pulse);
        $response = app(MessageProcessingService::class)->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            Str::uuid(),
        );

        $this->assertNotEmpty($response);
        $this->assertStringContainsStringIgnoringCase('77brainz', $response);
        $this->assertStringContainsStringIgnoringCase(
            'zunou-services',
            $response,
        );
    }

    public function test_admin_agent_can_lookup_hr_info()
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

        $agent = new AdminBaseAgent($pulse);

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
