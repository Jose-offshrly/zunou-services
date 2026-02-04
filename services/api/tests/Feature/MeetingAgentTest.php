<?php

namespace Tests\Feature;

use App\Models\Pulse;
use App\Models\User;
use App\Services\Agents\SubAgents\MeetingAgent;
use Tests\TestCase;

class MeetingAgentTest extends TestCase
{
    public function test_it_should_perform_similarity_search_if_postgres_fails(): void
    {
        $pulseId  = '4642613b-c9e1-4ef9-9b1b-30d7e8fd5b42';
        $orgId    = '9de646fb-0a17-4398-84de-94ea50fd562e';
        $threadId = '9ed631fd-0706-4992-b4f5-9094ab0afee7';
        $user_id  = '9de646fb-614b-445d-8c93-cf1a35d6ce29';

        $user = User::find($user_id);

        $agent       = new MeetingAgent(Pulse::find($pulseId));
        $summaryJSON = $agent->processSystemThread(
            'dataSourceAgent',
            'create summary for ZUnou stand up meeting April 25',
            // 'create summary for ZUnou stand up meeting, January 21',
            $user,
            $orgId,
            $pulseId,
            $threadId,
        );

        $summaryObject = json_decode($summaryJSON, true);

        // Assert summary text contains expected phrase
        $this->assertStringContainsString(
            'EXT: Zunou stand up Summary',
            $summaryObject['summary'],
        );
    }
}
