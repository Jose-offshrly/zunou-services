<?php

namespace Tests\Feature;

use GuzzleHttp\Client;
use Tests\TestCase;

class GettingStartedTest extends TestCase
{
    protected $graphqlEndpoint;
    protected $graphqlToken;
    protected $organizationId;
    protected $pulseId;
    protected static $threadId;
    protected $openAI;
    protected static $initialQuestion;

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

    public function testCreateThreadAndInitialCompletion()
    {
        $responseContent = $this->createCompletion('');
        $this->assertNotEmpty(
            $responseContent,
            'Failed to get response content from createCompletion.',
        );

        echo 'Thread created with ID:' . self::$threadId . "\n";
        echo "Initial Completion response: {$responseContent}\n";

        self::$initialQuestion = $responseContent;

        $isValidResponse = $this->validateResponseWithOpenAI($responseContent);
        $this->assertTrue(
            $isValidResponse,
            'Response evaluation did not meet the expected quality (rating of 4 or 5).',
        );
    }

    public function testRespondToInitialQuestion()
    {
        $generatedResponse = $this->generateResponseWithOpenAI(
            self::$initialQuestion,
        );
        $this->assertNotEmpty(
            $generatedResponse,
            'Failed to generate a response with OpenAI.',
        );

        $responseContent = $this->createCompletion($generatedResponse);
        $this->assertNotEmpty(
            $responseContent,
            'Failed to get response content from createCompletion.',
        );

        echo "Follow-up request response: {$responseContent}\n";

        // Check if the response is a positive confirmation using OpenAI
        $isPositiveConfirmation = $this->checkPositiveConfirmationWithOpenAI(
            $responseContent,
        );
        $this->assertTrue(
            $isPositiveConfirmation,
            'Expected a positive confirmation response from the system.',
        );
    }

    protected function checkPositiveConfirmationWithOpenAI($responseContent)
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $prompt = "Is the following response a positive confirmation of an update request? Respond with 'Yes' if it is and 'No' if it is not.\n\nResponse: \"$responseContent\"";

        $response = $this->openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'You are an evaluator who checks if a response confirms an update positively.',
                ],
                ['role' => 'user', 'content' => $prompt],
            ],
            'n' => 1,
        ]);

        $evaluationResult = $response['choices'][0]['message']['content'] ?? 'No';

        echo "Positive Confirmation Check: {$evaluationResult}\n";

        return stripos($evaluationResult, 'yes') !== false;
    }

    protected function createThread()
    {
        $query = <<<GQL
mutation CreateThread {
    createThread(
        input: {
            name: "Vacation test",
            organizationId: "{$this->organizationId}",
            type: "admin",
            pulseId: "{$this->pulseId}",
        }
    ) {
        id
    }
}
GQL;

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

        return $result['data']['createThread']['id'] ?? null;
    }

    protected function validateResponseWithOpenAI($responseContent)
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $evaluationPrompt = "Please evaluate the helpfulness and clarity of the following response. Rate it on a scale from 1 to 5, with 5 being fully accurate. Respond in the exact format: 'Rating: X' (where X is your score) on the first line. On the next line, explain briefly why you rated it that way.\n\nResponse: \"$responseContent\"";

        $params = [
            [
                'role'    => 'system',
                'content' => 'You are an evaluator. Rate the accuracy and clarity of the response.',
            ],
            [
                'role'    => 'user',
                'content' => $evaluationPrompt,
            ],
        ];

        $response = $this->openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => $params,
            'n'        => 1,
        ]);

        $evaluationResult = $response['choices'][0]['message']['content'] ?? 'No evaluation received';

        echo "Evaluation: {$evaluationResult}\n";

        // Check for a fixed format "Rating: 4" or "Rating: 5" at the start of the response
        if (preg_match('/^Rating:\s*(4|5)\b/i', $evaluationResult)) {
            return true;
        }

        return false;
    }

    protected function generateResponseWithOpenAI($initialQuestion)
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));

        $prompt = "Imagine you are a human HR representative responding to the following question naturally and professionally. You will be asked if the information is correct or not; respond saying that it is incorrect and provide a realistic adjustment that is suitable for the original question and information. Respond clearly and concisely:\n\nQuestion: \"$initialQuestion\"";

        $response = $this->openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'You are an HR representative.',
                ],
                ['role' => 'user', 'content' => $prompt],
            ],
            'n' => 1,
        ]);

        $generatedResponse = $response['choices'][0]['message']['content'] ?? null;
        echo "Generated response from OpenAI: {$generatedResponse}\n";

        return $generatedResponse;
    }

    protected function createCompletion($message = '')
    {
        // JSON encode the message to properly handle special characters and line breaks
        $escapedMessage = json_encode($message);

        // Remove the outer double quotes added by json_encode
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

        // echo "Query: {$query}\n";

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
        //echo "Result: " . json_encode($result) . "\n";
        if (
            isset($result['data']['createCompletion']) && is_array($result['data']['createCompletion'])
        ) {
            $latestMessage = end($result['data']['createCompletion']);
            return $latestMessage['content'] ?? null;
        }

        return $result['data']['createCompletion']['content'] ?? null;
    }
}
