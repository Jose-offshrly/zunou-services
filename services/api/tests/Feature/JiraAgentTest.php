<?php

namespace Tests\Feature;

use App\Models\Thread;
use App\Services\Agents\SubAgents\JiraAgent;
use App\Services\Agents\Traits\HasMCPClient;
use Tests\TestCase;

class JiraAgentTest extends TestCase
{
    use HasMCPClient;

    public function test_it_should_create_task_to_jira(): void
    {
        $userId   = '9de646fb-614b-445d-8c93-cf1a35d6ce29';
        $pulseId  = 'd0d8b7e0-3ed9-4726-adc8-07dcd84e25fb';
        $threadId = '9ef21c8f-d1a0-4fe4-8dcf-52d953bce2c2';

        $user   = \App\Models\User::findOrFail($userId);
        $pulse  = \App\Models\Pulse::findOrFail($pulseId);
        $thread = Thread::findOrFail($threadId);

        $orgId = $pulse->organization_id;

        $agent = new JiraAgent($pulse);

        $response = $agent->processMessage(
            collect([
                [
                    'content' => 'Create this Jira task for the project with key "MBA" to develop backend API endpoints.

Task details:
1. Summary: "Design database schema for user authentication"
   Description: "Create tables and relationships for storing user credentials and sessions."
   project_key: MBA
   issue_type: Task

   ',
                ],
            ]),
            $thread,
            $user,
            $orgId,
        );

        $this->assertStringContainsString('Issue Key', $response);
        $this->assertStringContainsString('Summary', $response);
        $this->assertStringContainsString('MBA', $response);
    }
}
