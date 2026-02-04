<?php

namespace App\Jobs;

use App\Contracts\RecommendationActionTypeInterface;
use App\Enums\RecommendationActionTypes;
use App\Enums\TaskType;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\Message;
use App\Services\Agents\SubAgents\DataSourceAgent;
use App\Services\Agents\SubAgents\MeetingAgent;
use App\Services\Agents\SubAgents\NotesAgent;
use App\Services\Agents\SubAgents\OrgChartAgent;
use App\Services\Agents\SubAgents\TaskAgent;
use App\Services\Agents\SubAgents\TeamChatAgent;
use App\Services\Agents\Traits\HasRecommendation;
use App\Services\OpenAIService;
use App\Services\RecommendationActionType\Note;
use App\Services\RecommendationActionType\Task;
use App\Services\RunStandAloneAgent;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateRecommendationResultJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(private array $rawRecommendation, private LiveInsightRecommendation $recommendation, private LiveInsightOutbox $insight, private array $siblings)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $agentRunner = new RunStandAloneAgent(
            $this->insight->pulse->id,
            $this->insight->organization->id,
            $this->insight->user_id,
        );

        $agentClass = match ($this->rawRecommendation["agent"]) {
            'TaskAgent' => TaskAgent::class,
            'NotesAgent' => NotesAgent::class,
            'MeetingAgent' => MeetingAgent::class,
            'TeamChatAgent' => TeamChatAgent::class,
            'DataSourceAgent' => DataSourceAgent::class,
            'OrgChartAgent' => OrgChartAgent::class,
            'GeneralAgent' => NotesAgent::class,
        };

        // #1 classify what operation or not supported
        $actionHandler = $this->getActionHandler($this->rawRecommendation["agent"]);

        $classification = $actionHandler::classifyOperation($this->rawRecommendation);

        if ($classification === RecommendationActionTypeInterface::UNSUPPORTED_OPERATION) {
            // fallback to note

            // if already have note for this in other recommendation skip and delete this recommendation
            $siblingNote = collect($this->siblings)->first(function ($item) {
                return ($item['agent'] ?? null) === 'NotesAgent';
            });
            if ($siblingNote) {
                Log::info("A sibling recommendation with type note is found. Skipping fallback note and deleting this recommendation");
                $this->recommendation->delete();
                return;
            }
            
            #reset
            $agentClass = NotesAgent::class;
            $actionHandler = $this->getActionHandler("NotesAgent");
            $classification = Note::CREATE_NOTE;

            $noteFallbackRecommendation = $this->convertRecommendationIntoNote();
            $this->rawRecommendation = [
                "title" => $noteFallbackRecommendation["title"],
                "description" => $noteFallbackRecommendation["description"],
                "next_agent_prompt" => $noteFallbackRecommendation["note_prompt"],
            ];
            
            // update the recommendation title and description with note version
            $this->recommendation->title = $noteFallbackRecommendation["title"];
            $this->recommendation->summary = $noteFallbackRecommendation["description"];
            $this->recommendation->save();
        }
   
        $operationSchema = $actionHandler::getOperationSchema($classification);

        $operationPrompt = $actionHandler::getOperationPrompt($classification, $this->rawRecommendation, $this->insight);

        $allowedTools = $actionHandler::getAllowedTools($classification);
        
        // #2 procceed to executing action if supported 
        $messages = collect([
            new Message([
                'role'    => 'user',
                'content' => $operationPrompt,
            ]),
        ]);

        // #3 if not supported, update the recommendation to create a note instead, then create a note
        $agent = new $agentClass($this->insight->pulse);
        if (!empty($allowedTools)){
            $agent->setAllowedTools($allowedTools);
        }

        $maxRetries = 3;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $response = $agentRunner->run(
                    messages: $messages,
                    threadType: '',
                    responseSchema: $operationSchema,
                    subagent: $agent,
                );
                break;

            } catch (\Throwable $e) {
               Log::warning("Agent run failed, retry {$attempt}/{$maxRetries}: " . $e->getMessage());

                if ($attempt === $maxRetries) {
                    $actionHandler::saveRecommendation($classification, $this->recommendation, $this->insight, ["error" => true]);
                    return;
                }
                sleep(1);
            }
        }

        $result = json_decode($response, true);

        $actionHandler::saveRecommendation($classification, $this->recommendation, $this->insight, $result);
    }

    private function getResultSchema(): array
    {
        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name'   => 'result_schema',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'status' => [
                            'type' => 'string',
                            'enum' => ['success', 'fail'],
                            'description' => 'Indicates whether the request succeeded or failed. If action already exists, set to "fail" because thats duplicate error.',
                        ],
                        'fail_type' => [
                            'type' => ['string', 'null'],
                            'enum' => ['incapable', 'error', 'not_found', 'other'],
                            'description' => <<<DESC
Specifies the reason for failure when status = "fail":
- **incapable** — The system lacks the capability or required tools to perform the action (e.g., missing integration, unsupported feature, or permission restriction).
- **error** — An internal or unexpected failure occurred during execution (e.g., exception, malformed input, or timeout).
- **not_found** — The request was valid but no matching records or data were found.
- **other** — Other reason for failure.
DESC,                       
                        ],
                        'message' => [
                            'type' => 'string',
                            'description' => 'A single, human-friendly sentence summarizing the result. It should be concise, final, and non-conversational — suitable for display in a notification.',
                        ],
                    ],
                    'required' => ['status', 'message', 'fail_type'],
                    'additionalProperties' => false,
                ],
            ],
        ];
    }


    private static function getActionHandler(string $agentname): string
    {
        return match ($agentname) {
            'TaskAgent' => \App\Services\RecommendationActionType\Task::class,
            'NotesAgent' => \App\Services\RecommendationActionType\Note::class,
            'TeamChatAgent' => \App\Services\RecommendationActionType\TeamChat::class,
            'MeetingAgent' => \App\Services\RecommendationActionType\Meeting::class,
        };
    }

    private function convertRecommendationIntoNote(): array
    {
        $insight = json_encode([
            "action" => $this->insight->type,
            "topic" => $this->insight->topic,
            "description" => $this->insight->description,
            "explanation" => $this->insight->explanation,
        ]);

        $recommendation = json_encode([
            "title" => $this->rawRecommendation["title"],
            "description" => $this->rawRecommendation["description"],
            "agent_prompt" => $this->rawRecommendation["next_agent_prompt"],
        ]);

        $prompt = <<<EOD
        See this insight,
        {$insight}

        This insight have these recommendation for the user, 
        {$recommendation}

        However, this recommendation is not supported in the system; hence, it cannot be executed. To still assist the user, we will convert this recommendation into a create note recommendation.

        I want you to transform the original recommendation into a new note version.

        Example
        Original Version
        title: Schedule meeting for tommorow's client meeting
        description: Set up a meeting for tommorows client meeting.

        New Note Version
        title: Create note: Schedule meeting for client meeting
        description: (a short description summarizing the original recommendation)

        Also provide in your response the "note prompt", this will serve as the instruction for Note LLM agent to finally execute this recommendation. The note agent will do the actual creation of note.
        Make sure to provide all the details from the insight and recommendation on the note prompt.

        return your output in this structure,
        title: (the recommendation title starting with "Create note: ")
        description:  (a short description summarizing the original recommendation)
        note_prompt: (the prompt for creating the note containing complete and detailed information of the original recommendation and insight)

        Now convert the recommendation below into a create note recommendation:
        EOD;

        $responseFmt = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'create_note_recommendation_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'title' => [
                            'type' => 'string',
                            'description' => 'A short, clear title of the recommendation. Starts with "Create Note: " format',
                        ],
                        'description' => [
                            'type' => 'string',
                            'description' => 'A concise description of the recommendation.',
                        ],
                        'note_prompt' => [
                            'type' => 'string',
                            'description' => 'A descriptive prompt to the note agent that will handle the recommendation. This message will be executed by the note agent to run the recommendation.'
                        ]
                    ],
                    'required'             => ['title', 'description', 'note_prompt'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $request = [
            'model' => 'gpt-4.1',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $prompt
                ]
            ],
            'response_format' => $responseFmt
        ];

        $response = OpenAIService::createCompletion($request);
        $assistant = $response['choices'][0]['message'];
        $content = $assistant['content'];

        return json_decode($content, true);
    }
}
