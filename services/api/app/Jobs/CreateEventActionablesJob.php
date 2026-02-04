<?php

namespace App\Jobs;

use App\Actions\Actionable\CreateActionableAction;
use App\DataTransferObjects\ActionableData;
use App\Events\EventActionablesCompleted;
use App\Models\Meeting;
use App\Models\MeetingSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CreateEventActionablesJob implements ShouldQueue
{
    use Queueable;

    private Meeting $meeting;
    private ?string $eventId;

    /**
     * Create a new job instance.
     */
    public function __construct(Meeting $meeting, ?string $eventId = null)
    {
        $this->meeting = $meeting;
        $this->eventId = $eventId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Creating event actionables', [
            'meetingId'      => $this->meeting->id,
            'pulseId'        => $this->meeting->pulse_id,
            'organizationId' => $this->meeting->dataSource->organization_id,
        ]);

        $startTime = microtime(true);

        try {
            $actionableSchema = [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'actionable_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            'actionable_items' => [
                                'type'  => 'array',
                                'items' => [
                                    'type' => 'string',
                                ],
                            ],
                        ],
                        'required'             => ['actionable_items'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ];

            $prompt = <<<PROMPT
You are an assistant designed to extract actionable tasks from meeting transcripts.

Carefully read the following meeting transcript and identify any concrete action items discussed, suggested, or agreed upon. Each action item should include:
- A clear description of the task but keep it short and concise.

Only include real, actionable items — not general discussion or commentary.

Meeting Transcript:
{$this->meeting->transcript->content}
PROMPT;

            $params = [
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ];

            $req = [
                'model'           => 'gpt-4.1',
                'messages'        => $params,
                'response_format' => $actionableSchema,
                'temperature'     => 0.7,
            ];
            $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
            $response = $openAI->chat()->create($req);
            $result   = json_decode(
                $response['choices'][0]['message']['content'],
                true,
            );

            $actionables = $result['actionable_items'] ?? [];

            $meetingSession = MeetingSession::where(
                'data_source_id',
                $this->meeting->dataSource->id,
            )->first();

            foreach ($actionables as $actionable) {
                $actionableData = new ActionableData(
                    description: $actionable,
                    pulse_id: $this->meeting->pulse_id,
                    organization_id: $this->meeting->dataSource
                        ->organization_id,
                    data_source_id: $this->meeting->dataSource->id,
                    event_id: $this->eventId ?? ($meetingSession->event_id ?? null),
                );
                $createActionableAction = new CreateActionableAction();
                $createActionableAction->handle($actionableData);
            }

            $timeTook = microtime(true) - $startTime;

            Log::info(
                "Event actionables created. Took {$timeTook} seconds to complete",
                [
                    'meetingId'      => $this->meeting->id,
                    'pulseId'        => $this->meeting->pulse_id,
                    'organizationId' => $this->meeting->dataSource->organization_id,
                    'actionables'    => $actionables,
                ],
            );

            // Get the event ID for the Pusher event
            $eventId = $this->eventId ?? ($meetingSession->event_id ?? null);

            // Dispatch the Pusher event when actionables are completed
            if ($eventId) {
                event(
                    new EventActionablesCompleted(
                        meeting: $this->meeting,
                        eventId: $eventId,
                        actionables: $actionables,
                        organizationId: $this->meeting->dataSource
                            ->organization_id,
                    ),
                );
            }
        } catch (\Throwable $th) {
            Log::error('Error creating event actionables', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
        }
    }
}
