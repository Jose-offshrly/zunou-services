<?php

namespace App\Jobs;

use App\Jobs\Middleware\LogQueryPerformanceMiddleware;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\Transcript;
use App\Services\OpenAIService;
use App\Services\RunStandAloneAgent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InsightRecommendationGeneratorJob implements ShouldQueue
{
    use Queueable;

    private LiveInsightOutbox $insight;

    public function __construct($insightId)
    {
        $insight = LiveInsightOutbox::with(['pulse', 'organization'])->find($insightId);
        if (!$insight) {
            Log::error("Insight not found", [
                'insight_id' => $insightId,
            ]);
            throw new \Exception("Insight not found");
        }

        $this->insight = $insight;
    }

    public function middleware()
    {
        return [new LogQueryPerformanceMiddleware()];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!$this->insight->pulse || !$this->insight->organization) {
            return;
        }

        Log::info("InsightRecommendationGeneratorJob: Starting recommendation generation", [
            'insight_id' => $this->insight->id,
            'item_hash' => $this->insight->item_hash,
            'topic' => $this->insight->topic,
            'description' => $this->insight->description,
            'explanation' => $this->insight->explanation,
        ]);

        $cacheKey = "insights:processing:{$this->insight->item_hash}";
        $cacheListKey = "insights:processing";
        try {
            $runStandAloneAgent = new RunStandAloneAgent(
                $this->insight->pulse_id,
                $this->insight->organization_id,
                $this->insight->user_id,
            );

            $userPrompt = $this->getPrompt();

            $messages = collect([
                [
                    'role'    => 'user',
                    'content' => $userPrompt,
                ],
            ]);

            $response = $runStandAloneAgent->run(
                collect($messages),
                'live_insights',
                $this->getRecommendationSchema(),
            );

            Log::info("InsightRecommendationGeneratorJob: Response", [
                'response' => $response,
            ]);

            $recommendations = json_decode($response, true)['recommendations'] ?? [];
            if (empty($recommendations)) {
                Log::info("InsightRecommendationGeneratorJob: No recommendations generated", [
                    'insight_id' => $this->insight->id
                ]);
                return;
            }

            // get all insights with the same item_hash
            $insights = LiveInsightOutbox::where('item_hash', $this->insight->item_hash)
                ->doesntHave('recommendations')
                ->get();

            foreach ($recommendations as $i => $rawRecommendation) {
                $recommendation = LiveInsightRecommendation::create([
                    'title' => $rawRecommendation['title'],
                    'summary' => $rawRecommendation['description'],
                ]);

                // attach the recommendations to the insights
                $pivotData = [];
                foreach ($insights as $insight) {
                    try {
                        Log::info("dispatching generate recommendation result job", [
                            'insight_id' => $insight->id,
                            'recommendation_id' => $recommendation->id,
                        ]);
                        $siblings = $recommendations;
                        unset($siblings[$i]);
                        GenerateRecommendationResultJob::dispatch($rawRecommendation, $recommendation, $insight, $siblings)->onQueue('default');

                        $now = now();
                        $pivotData[] = [
                            'live_insight_outbox_id' => $insight->id,
                            'live_insight_recommendation_id' => $recommendation->id,
                            'user_id' => $insight->user_id,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    } catch (\Throwable $th) {
                        Log::error("InsightRecommendationGeneratorJob: Error generating result", [
                            'insight_id' => $insight->id,
                            'error' => $th->getMessage(),
                            'trace' => $th->getTraceAsString(),
                        ]);
                    }
                }
                DB::table('live_insight_outbox_recommendation')->insertOrIgnore($pivotData);
            }

            Log::info("InsightRecommendationGeneratorJob: Generated recommendations", [
                'insight_id' => $this->insight->id,
                'recommendations_count' => count($recommendations),
                'insights_updated' => $insights->count()
            ]);

        } catch (\Throwable $th) {
            Log::error("InsightRecommendationGeneratorJob: Error processing insight recommendation", [
                'insight_id' => $this->insight->id,
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
        } finally {
            $this->refreshInsightListCache($cacheListKey, [$this->insight->item_hash]);
            Cache::store('file')->forget($cacheKey);
        }
    }

    private function refreshInsightListCache(string $cacheKey, array $idsToRemove): void
    {
        // this can be improved to use a lock to avoid race conditions
        $meetingIdsBeingProcessed = Cache::store('file')->get($cacheKey, []);
        if (!empty($idsToRemove)) {
            $meetingIdsBeingProcessed = array_diff($meetingIdsBeingProcessed, $idsToRemove);
            $ttl = now()->addHours(1); 
            Cache::store('file')->put(
                $cacheKey, 
                $meetingIdsBeingProcessed, 
                $ttl
            );
        }
    }


    private function getRecommendationSchema(): array
    {
        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name'   => 'recommendations_schema',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'recommendations' => [
                            'type' => 'array',
                            'description' => 'A list of actionable recommendations for the insight.',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'title' => [
                                        'type' => 'string',
                                        'description' => 'A short, clear title of the recommendation. Format: ',
                                    ],
                                    'description' => [
                                        'type' => 'string',
                                        'description' => 'A concise description of the recommendation.',
                                    ],
                                    'agent' => [
                                        'type' => 'string',
                                        'enum' => ['TaskAgent', 'NotesAgent', 'MeetingAgent', 'TeamChatAgent','Others'],
                                        'description' => 'The name of the agent that will handle the recommendation later on.',
                                    ],
                                    'next_agent_prompt' => [
                                        'type' => 'string',
                                        'description' => 'A descriptive prompt to the agent that will handle the recommendation later on. This message will be executed by the agent(TaskAgent, NoteAgent, MeetingAgent, TeamChatAgent, DataSourceAgent, OrgChartAgent, Others etc.) to run the recommendation.',
                                    ],
                                    'reasoning_steps' => [
                                        'type' => 'array',
                                        'description' => 'A list of reasoning steps to justify the recommendation.',
                                        'items' => [
                                            'type' => 'string',
                                            'description' => 'A concise summary or reasoning behind the recommendation.',
                                        ],
                                    ],
                                ],
                                'required' => [
                                    'title',
                                    'description',
                                    'agent',
                                    'next_agent_prompt',
                                    'reasoning_steps',
                                ],
                                'additionalItems' => false,
                            ],
                            'minItems' => 1,
                            'maxItems' => 2,
                        ]
                    ],
                    'required' => [
                        'recommendations',
                    ],
                ],
            ],
        ];
    }

    private function getPrompt(): string
    {
        $insightsData = json_encode([
            'topic' => $this->insight->topic,
            'description' => $this->insight->description,
            'explanation' => $this->insight->explanation,
        ]);

        $meetingContext = $this->extractMeetingContext($this->insight->meeting_id);

        return <<<EOD
Give me 1–2 recommendations that I can perform inside the system based on the insight and the meeting context below.

# Insight Data
{$insightsData}

# Meeting Context (Structured for Recommendation Engine)
{$meetingContext}

Guidelines:
- Choose the MOST appropriate system capability (TaskAgent, MeetingAgent, TeamChatAgent, NotesAgent, Others). Do NOT default to tasks.
- If the meeting context shows urgency, blockers, misalignment, or follow-ups, prioritize communication or meeting-based actions.
- Only recommend actions that are independent (no dependency on other actions being done first).
- Do not execute any action; only return the recommendation.

Your output should contain only the recommendations.

EOD;

    }

    private function extractMeetingContext($meetingId): string
    {
        $transcript = Transcript::where("meeting_id", $meetingId)->first();
        $prompt = <<<EOD
You are a Context Extraction Agent. Your job is to read the meeting transcript and extract ONLY the information that is relevant to the specific insight provided below.

Your output will be used by another agent to generate recommendations, so the context must be:
- precise
- minimal
- directly related to the insight
- include the key signals that imply what actions are needed next

DO NOT summarize the whole meeting.
DO NOT include unrelated discussion.
DO NOT include opinions or invented content.
Extract only what truly appears in the transcript.

# Insight
Title: {$this->insight->title}
Description: {$this->insight->description}
Explanation: {$this->insight->explanation}

# Transcript
{$transcript->content}

# Your Task
Extract ONLY the parts of the transcript that directly relate to the insight above.

Then, using ONLY information from the transcript, identify:
- who discussed this issue
- any problems, blockers, or concerns mentioned
- any commitments (e.g., “I’ll check this”, “I’ll try it today”)
- any deadlines or time sensitivity
- any follow-up that someone is waiting for
- any confusion, disagreement, or unresolved items
- any urgency signals (e.g., “urgent”, “ASAP”, “blocked”, “needs to be fixed soon”)

# Output Format (JSON)

{
  "meeting_title": "<exact title>",
  "meeting_type": "<e.g., stand-up, planning, retro, etc.>",
  "purpose": "<brief purpose based only on transcript and the meeting type>",
  "participants_involved_with_insight": [],
  "relevant_discussion": [
    "…exact transcript excerpts relevant to the insight…"
  ],
  "problems_or_blockers": [],
  "commitments_made": [],
  "deadlines_or_time_sensitivity": [],
  "follow_up_signals": [],
  "urgency_level": "none | low | medium | high",
  "summary_for_recommendation_engine": "1–3 sentence distilled summary of what the recommendation agent needs to know."
}

Rules:
- If something is not explicitly stated, leave it empty.
- Do not hallucinate.
- Keep the JSON strictly valid.
- The “relevant_discussion” field MUST contain actual text from the transcript.
- “summary_for_recommendation_engine” must NOT invent new facts, only compress what was extracted.
EOD;
        $params = [
            "messages" => [
                [
                    "role" => "user",
                    "content" => $prompt
                ]
            ],
            "model" => "gpt-4.1-mini",
        ];
        $res = OpenAIService::createCompletion($params);
        return $res->choices[0]->message->content;
    }
}