<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use OpenAI;
use Tests\TestCase;

class HRAgentFrontEndTest extends TestCase
{
    protected $graphqlEndpoint;
    protected $graphqlToken;
    protected $organizationId;
    protected $threadId;
    protected $pulseId;
    protected $conversationHistory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->graphqlEndpoint     = env('GRAPHQL_ENDPOINT');
        $this->graphqlToken        = env('GRAPHQL_TOKEN');
        $this->organizationId      = env('TESTING_ORGANIZATION_ID');
        $this->pulseId             = env('TESTING_PULSE_ID');
        $this->conversationHistory = []; // Initialize the conversation history

        // Create a new thread and set the thread ID for the test
        $this->threadId = $this->createNewThread();
    }

    // Method to create a new thread via GraphQL and return its ID
    protected function createNewThread()
    {
        $query = <<<GQL
mutation CreateThread {
    createThread(
        input: {
            name: "User thread",
            organizationId: "{$this->organizationId}",
            type: "user",
            pulseId: "{$this->pulseId}"
        }
    ) {
        id
    }
}
GQL;

        $client = new \GuzzleHttp\Client([
            'headers' => [
                'Authorization' => "Bearer {$this->graphqlToken}",
                'Content-Type'  => 'application/json',
            ],
        ]);

        $response = $client->post($this->graphqlEndpoint, [
            'json' => ['query' => $query],
        ]);

        $result = json_decode($response->getBody(), true);

        if (isset($result['data']['createThread']['id'])) {
            return $result['data']['createThread']['id'];
        }

        throw new \Exception('Failed to create thread.');
    }

    // Helper method to interact with OpenAI using your library
    protected function getOpenAIMessage($systemPrompt, $userPrompt)
    {
        $openAI = OpenAI::client(config('zunou.openai.api_key'));

        // Compile the conversation history into a single prompt for OpenAI
        $conversationContext   = implode("\n", $this->conversationHistory);
        $userPromptWithHistory = "$conversationContext\nUser: $userPrompt";

        $response = $openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $systemPrompt,
                ],
                [
                    'role'    => 'user',
                    'content' => $userPromptWithHistory .
                        ' Please provide a unique, helpful response to keep the conversation going naturally.',
                ],
            ],
        ]);

        return $response['choices'][0]['message']['content'] ?? '';
    }

    // Helper method to send GraphQL requests with the `createCompletion` mutation
    protected function sendGraphQLRequest($message)
    {
        // Escape double quotes and remove newlines for GraphQL compatibility
        $escapedMessage = str_replace('"', '\"', $message);
        $escapedMessage = preg_replace('/\s+/', ' ', $escapedMessage); // Replace newlines and extra whitespace with a single space

        $query = <<<GQL
mutation CreateCompletion {
    createCompletion(
        input: {
            threadId: "{$this->threadId}",
            organizationId: "{$this->organizationId}",
            message: "{$escapedMessage}"
        }
    ) {
        content
    }
}
GQL;

        $client = new \GuzzleHttp\Client([
            'headers' => [
                'Authorization' => "Bearer {$this->graphqlToken}",
                'Content-Type'  => 'application/json',
            ],
            'timeout'         => 360,
            'connect_timeout' => 10,
        ]);

        $response = $client->post($this->graphqlEndpoint, [
            'json' => ['query' => $query],
        ]);

        $result = json_decode($response->getBody(), true);

        Log::info('GraphQL response:', $result);

        // Check for errors in the response
        if (isset($result['errors'])) {
            Log::error('GraphQL errors:', $result['errors']);
            throw new \Exception(
                'GraphQL request failed with errors: ' .
                    json_encode($result['errors']),
            );
        }

        // Retrieve only the latest message from the conversation history
        if (
            ! empty($result['data']['createCompletion']) && is_array($result['data']['createCompletion'])
        ) {
            $latestMessage = end($result['data']['createCompletion']);
            return $latestMessage['content'] ?? null;
        }

        return null;
    }

    // Main test method simulating the dynamic conversation
    public function testGraphQLConversation()
    {
        $systemPrompt = 'We are testing a system called Pulse that assists people working in a company, like an HR FAQ bot. Generate unique, natural messages for a new employee asking about company policies. Remember, you are the employee asking questions.';

        // Start the conversation with the first OpenAI-generated message
        $userMessage = $this->getOpenAIMessage(
            $systemPrompt,
            'Start the conversation by asking a question as if you are an employee.',
        );
        $this->assertNotEmpty(
            $userMessage,
            'Failed to get initial message from OpenAI',
        );

        $this->conversationHistory[] = "User: $userMessage";

        $maxIterations = 5;

        for ($i = 0; $i < $maxIterations; $i++) {
            $pulseResponse = $this->sendGraphQLRequest($userMessage);
            $this->assertNotEmpty(
                $pulseResponse,
                'Failed to get a response from GraphQL',
            );

            echo "Round $i:\nUser: \"$userMessage\"\nPulse: \"$pulseResponse\"\n";

            $this->conversationHistory[] = "Pulse: $pulseResponse";

            $userPrompt  = "Respond to Pulse's last message to continue the conversation.";
            $userMessage = $this->getOpenAIMessage($systemPrompt, $userPrompt);
            $this->assertNotEmpty(
                $userMessage,
                'Failed to get next message from OpenAI',
            );

            $this->conversationHistory[] = "User: $userMessage";

            if (stripos($userMessage, 'goodbye') !== false) {
                break;
            }
        }

        echo 'Conversation completed after ' . ($i + 1) . " rounds.\n";

        // Analyze the entire conversation for helpfulness
        $this->analyzeConversationHelpfulness();
    }

    // New method to analyze the entire conversation's helpfulness
    protected function analyzeConversationHelpfulness()
    {
        $openAI = OpenAI::client(config('zunou.openai.api_key'));

        $conversationContext = implode("\n", $this->conversationHistory);
        $analysisPrompt      = "The following is a conversation between a new employee and a system called Pulse.  The system should be able to help by giving actual information to the user and should only redirect the user as a last resort. Please critically evaluate each response from Pulse on helpfulness, with ratings from 1 to 5 (5 being very helpful). Provide brief explanations for each rating.  Then finally give suggestions on what data or features need to be added to Pulse to make it operate better.  \n\n" .
            $conversationContext;

        $response = $openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'You are a conversation analyst. Rate the helpfulness of each response from Pulse on a scale from 1 to 5 and explain each rating briefly.  Give your final analysis at the end including any information that the Pulse system should add to its Knowledgebase in order to help the customer better.',
                ],
                [
                    'role'    => 'user',
                    'content' => $analysisPrompt,
                ],
            ],
        ]);

        $analysisResult = $response['choices'][0]['message']['content'] ?? 'No analysis received';

        Log::info("Conversation Helpfulness Analysis:\n" . $analysisResult);
        echo "Helpfulness Analysis:\n" . $analysisResult . "\n";
    }
}
