<?php

namespace Tests\Feature;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class GenericPulseTest extends TestCase
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
        $initialMessage  = 'What is the Pulse project about?';
        $initialResponse = $this->createCompletion($initialMessage);

        $this->assertNotEmpty(
            $initialResponse,
            'Failed to get response for the initial request.',
        );

        $lastMessageContent = $this->getLastMessageContent($initialResponse);
        echo "Initial Response: {$lastMessageContent}\n";

        // Step 2: Validate if there is a project description in the response
        $description = $this->validateResponse($lastMessageContent);
        $this->assertNotEmpty(
            $description,
            'Expected a description of the project in the response.',
        );

        echo "Test complete: Looks good.\n";
    }

    protected function createThread()
    {
        $query = <<<GQL
mutation CreateThread {
    createThread(
        input: {
            name: "Request info about Pulse",
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

    protected function validateResponse($responseContent)
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $prompt = "Does the following text contain a sensible description of what the pulse project is about?  If yes, respond with 'yes'. If no, respond with 'No'.\n\nResponse: \"$responseContent\"";

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
