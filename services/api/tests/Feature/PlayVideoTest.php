<?php

namespace Tests\Feature;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class PlayVideoTest extends TestCase
{
    protected $graphqlEndpoint;
    protected $graphqlToken;
    protected $organizationId;
    protected $pulseId;
    protected static $threadId;
    protected $openAI;

    protected function setUp(): void
    {
        parent::setUp();

        $this->graphqlEndpoint = env('GRAPHQL_ENDPOINT');
        $this->graphqlToken    = env('GRAPHQL_TOKEN');
        $this->organizationId  = env('TESTING_ORGANIZATION_ID');
        $this->pulseId         = env('TESTING_PULSE_ID');

        if (! isset(self::$threadId)) {
            self::$threadId = $this->createThread();
            $this->assertNotEmpty(
                self::$threadId,
                'Failed to create a new thread.',
            );
        }
    }

    public function testPlayVideoScenario()
    {
        // Step 1: Send the initial request
        $initialMessage  = "Can you play Malek's self-introduction video in English please";
        $initialResponse = $this->createCompletion($initialMessage);
        Log::info($initialResponse);
        $this->assertNotEmpty(
            $initialResponse,
            'Failed to get response for the initial request.',
        );

        $lastMessageContent = $this->getLastMessageContent($initialResponse);
        echo "Initial Response: {$lastMessageContent}\n";

        // Step 2: Validate and extract video link from the initial response
        $videoLink = $this->validateAndExtractVideoLink($lastMessageContent);
        if ($videoLink) {
            echo "1st Test complete: Video link found in initial response: {$videoLink}\n";
        }

        // Step 3: Request a translation
        $followUpMessage  = 'Please translate the video into Japanese.';
        $followUpResponse = $this->createCompletion($followUpMessage);

        $this->assertNotEmpty(
            $followUpResponse,
            'Failed to get response for the follow-up request.',
        );

        $lastMessageContent = $this->getLastMessageContent($followUpResponse);
        echo "Follow-Up Response: {$lastMessageContent}\n";
        Log::info($lastMessageContent);
        exit();
        // Step 4: Validate and extract video link from the follow-up response
        $videoLink = $this->validateAndExtractVideoLink($lastMessageContent);
        $this->assertNotEmpty(
            $videoLink,
            'Expected a video link in the follow-up response.',
        );

        echo "Test complete: Video link found in follow-up response: {$videoLink}\n";
    }

    protected function createThread()
    {
        $query = <<<GQL
mutation CreateThread {
    createThread(
        input: {
            name: "Play Video Test",
            organizationId: "{$this->organizationId}",
            type: "admin",
            pulseId: "{$this->pulseId}"
        }
    ) {
        id
    }
}
GQL;
        Log::info($query);

        $client = new Client([
            'headers' => [
                'Authorization' => "Bearer {$this->graphqlToken}",
                'Content-Type'  => 'application/json',
            ],
        ]);

        $response = $client->post($this->graphqlEndpoint, [
            'json' => ['query' => $query],
        ]);

        $result = json_decode($response->getBody(), true);
        Log::info($result);
        return $result['data']['createThread']['id'] ?? null;
    }

    protected function createCompletion($message)
    {
        $escapedMessage = json_encode($message);
        $escapedMessage = substr($escapedMessage, 1, -1);

        $query = '
mutation CreateCompletion {
    createCompletion(
        input: {
            threadId: "' .
            self::$threadId .
            '",
            organizationId: "' .
            $this->organizationId .
            '",
            message: "' .
            $escapedMessage .
            '"
        }
    ) {
        content
    }
}
';

        $client = new Client([
            'headers' => [
                'Authorization' => "Bearer {$this->graphqlToken}",
                'Content-Type'  => 'application/json',
            ],
        ]);

        $response = $client->post($this->graphqlEndpoint, [
            'json' => ['query' => $query],
        ]);

        $result = json_decode($response->getBody(), true);

        return $result['data']['createCompletion'] ?? [];
    }

    protected function getLastMessageContent(array $response)
    {
        $messages    = $response;
        $lastMessage = end($messages);

        return $lastMessage['content'] ?? '';
    }

    protected function validateAndExtractVideoLink($responseContent)
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $prompt = "Does the following text contain a datasource refering to Malek's self-introduction video? If yes, respond with 'yes'. If no, respond with 'No'.\n\nResponse: \"$responseContent\"";

        $aiResponse = $this->openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'You are an evaluator that checks responses.',
                ],
                ['role' => 'user', 'content' => $prompt],
            ],
            'n' => 1,
        ]);

        $evaluationResult = $aiResponse['choices'][0]['message']['content'] ?? 'No';

        echo "AI Validation Response: {$evaluationResult}\n";

        // Use regex to extract the .mp4 link if AI confirms its presence
        if (stripos($evaluationResult, 'yes') !== false) {
            return 'yes';
        }

        return null;
    }
}
