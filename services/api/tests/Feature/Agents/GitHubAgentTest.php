<?php

namespace Tests\Feature\Agents;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\GitHubAgent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GitHubAgentTest extends TestCase
{
    //use RefreshDatabase;

    public function testGitHubAgentHandlesPullRequestQueryWithToken()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user  = \App\Models\User::findOrFail($userId);
        $pulse = \App\Models\Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();

        $orgId = $pulse->organization_id;

        // Ensure integration with GitHub token exists
        $this->assertDatabaseHas('integrations', [
            'user_id'  => $userId,
            'pulse_id' => $pulseId,
            'type'     => 'github',
        ]);

        $thread = \App\Models\Thread::create([
            'name'            => 'Test GitHub Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => (string) Str::uuid(),
            'user_id'         => $userId,
            'type'            => 'githubAgent',
            'is_active'       => true,
        ]);

        $agent    = new \App\Services\Agents\GitHubAgent($pulseId);
        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'can you give me a list of pull requests please',
            ],
        ]);

        $response = $agent->processMessage(
            $messages,
            $thread,
            $user,
            $thread->id, // unused
        );
        print_r($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
        $this->assertStringNotContainsString(
            'GitHub is not connected',
            $response,
        );
    }

    public function testGitHubAgentHandlesPullRequestQueryWithRepoInfo()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();

        $orgId = $pulse->organization_id;

        $this->assertDatabaseHas('integrations', [
            'user_id'  => $userId,
            'pulse_id' => $pulseId,
            'type'     => 'github',
        ]);

        $thread = Thread::create([
            'name'            => 'Test GitHub Thread w/ Repo Info',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'githubAgent',
            'is_active'       => true,
        ]);

        $agent    = new GitHubAgent($pulseId);
        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'List pull requests for owner "77brainz" and repo "zunou-services"',
            ],
        ]);
        $response = $agent->processMessage(
            $messages,
            $thread,
            $user,
            $thread->id, // unused
        );

        print_r($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
        $this->assertStringNotContainsString(
            'GitHub is not connected',
            $response,
        );
    }

    // run like this:
    //TEST_PR_NUMBER=42 php artisan test --filter=GitHubAgentTest::testGitHubAgentCanMergePullRequest
    public function testGitHubAgentCanMergePullRequest()
    {
        $prNumber = env('TEST_PR_NUMBER');

        if (! is_numeric($prNumber)) {
            $this->markTestSkipped(
                'TEST_PR_NUMBER must be set to a valid pull request number.',
            );
        }

        // Same setup as before...
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();

        $orgId = $pulse->organization_id;

        $thread = Thread::create([
            'name'            => 'Test GitHub Merge Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'githubAgent',
            'is_active'       => true,
        ]);

        $agent    = new GitHubAgent($pulseId);
        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'Please merge pull request number {$prNumber} in the repo \"zunou-services\" owned by \"77brainz\"',
            ],
        ]);
        $response = $agent->processMessage(
            $messages,
            $thread,
            $user,
            $thread->id, // unused
        );

        print_r($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
        $this->assertStringNotContainsString(
            'GitHub is not connected',
            $response,
        );
    }

    public function testGitHubAgentCanRunWorkflow()
    {
        $userId  = '9babc0b6-5406-4474-ac89-d3c613112b35';
        $pulseId = '4c689cf4-ab49-40ba-aabb-d35f9bddc75b';
        $uuid    = (string) Str::uuid();

        $user  = User::findOrFail($userId);
        $pulse = Pulse::where('id', $pulseId)
            ->whereHas('members', fn ($q) => $q->where('user_id', $userId))
            ->firstOrFail();

        $orgId = $pulse->organization_id;

        $this->assertDatabaseHas('integrations', [
            'user_id'  => $userId,
            'pulse_id' => $pulseId,
            'type'     => 'github',
        ]);

        $thread = Thread::create([
            'name'            => 'Test GitHub Workflow Thread',
            'organization_id' => $orgId,
            'pulse_id'        => $pulseId,
            'third_party_id'  => $uuid,
            'user_id'         => $userId,
            'type'            => 'githubAgent',
            'is_active'       => true,
        ]);

        $agent    = new GitHubAgent($pulseId);
        $messages = collect([
            [
                'role'    => 'user',
                'content' => 'Trigger the workflow "global-create-staging-release.yml" in the repo "zunou-services" owned by "77brainz" on branch "main"',
            ],
        ]);
        $response = $agent->processMessage(
            $messages,
            $user,
            $orgId,
            $pulseId,
            $thread->id,
        );

        print_r($response);
        $this->assertIsString($response);
        $this->assertNotEmpty($response);
        $this->assertMatchesRegularExpression(
            '/\b(successfully|triggered)\b.*\b(triggered|successfully)\b/i',
            $response,
        );
    }
}
