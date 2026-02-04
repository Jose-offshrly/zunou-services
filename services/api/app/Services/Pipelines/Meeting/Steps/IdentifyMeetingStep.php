<?php

namespace App\Services\Pipelines\Meeting\Steps;

use App\Models\Meeting;
use App\Services\OpenAIService;
use App\Services\Pipelines\Contracts\PipelineStepInterface;
use App\Services\Pipelines\Meeting\MeetingSummaryContext;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class IdentifyMeetingStep implements PipelineStepInterface
{
    public function handle($ctx)
    {
        if (!$ctx instanceof MeetingSummaryContext) {
            throw new \TypeError('Expected MeetingSummaryContext');
        }

        if (!$ctx->thread->relationLoaded('pulse')) {
            $ctx->thread->load('pulse');
        }
        $ctx->pulse = $ctx->thread->pulse;

        $meetingInfo = $this->identifyMeeting($ctx);
        $ctx->meeting_info = $meetingInfo;

        if ($meetingInfo) {
            Log::info('[Pipeline Step: IdentifyMeetingStep] Meeting identified', [
                'meeting_id' => $meetingInfo['id'],
                'meeting_title' => $meetingInfo['meeting_title'],
                'date' => $meetingInfo['date'],
                'data_source_id' => $meetingInfo['data_source_id'],
            ]);
            $ctx->success = true;
        } else {
            Log::warning('[Pipeline Step: IdentifyMeetingStep] Could not identify meeting');
            $ctx->success = false;
            $ctx->error = 'MEETING_NOT_FOUND';
            $ctx->result = "Meeting could not be found. Pass the request to the Meeting Agent";
        }

        return $ctx;
    }

    protected function identifyMeeting(MeetingSummaryContext $ctx): ?array
    {
        $userTimezone = $ctx->user->timezone ?? 'UTC';
        $now = Carbon::now($userTimezone);

        $monthAgoStart = $now->copy()->subMonth()->startOfDay()->utc();
        $nowUtc = $now->copy()->endOfDay()->utc();

        $meetings = Meeting::where('pulse_id', $ctx->pulse_id)
            ->whereNotNull('data_source_id')
            ->whereBetween('date', [$monthAgoStart, $nowUtc])
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        Log::info('[Pipeline Step: IdentifyMeetingStep] Queried top 20 meetings from past month', [
            'count' => $meetings->count(),
            'date_range' => [$monthAgoStart->toDateTimeString(), $nowUtc->toDateTimeString()],
        ]);

        if ($meetings->isEmpty()) {
            Log::warning('[Pipeline Step: IdentifyMeetingStep] No recent meetings found');
            return null;
        }

        $todayMeetings = [];
        $yesterdayMeetings = [];
        $weekMeetings = [];
        $olderMeetings = [];
        
        $yesterdayStartLocal = $now->copy()->subDay()->startOfDay();
        $weekAgoStartLocal = $now->copy()->subWeek()->startOfDay();

        foreach ($meetings as $meeting) {
            $date = Carbon::parse($meeting->date);
            
            $meetingData = [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'date' => $date->format('F j, Y'),
                'time' => $date->format('g:i A'),
                'data_source_id' => $meeting->data_source_id,
            ];

            if ($date->isSameDay($now)) {
                $todayMeetings[] = $meetingData;
            } elseif ($date->isSameDay($now->copy()->subDay())) {
                $yesterdayMeetings[] = $meetingData;
            } elseif ($date->isAfter($weekAgoStartLocal) && $date->isBefore($yesterdayStartLocal)) {
                $weekMeetings[] = $meetingData;
            } else {
                $olderMeetings[] = $meetingData;
            }
        }

        $currentDate = $now->format('F j, Y');

        $todayMeetingsText = !empty($todayMeetings) 
            ? json_encode($todayMeetings, JSON_PRETTY_PRINT)
            : 'No meetings';
        
        $yesterdayMeetingsText = !empty($yesterdayMeetings)
            ? json_encode($yesterdayMeetings, JSON_PRETTY_PRINT)
            : 'No meetings';
        
        $weekMeetingsText = !empty($weekMeetings)
            ? json_encode($weekMeetings, JSON_PRETTY_PRINT)
            : 'No meetings';

        $olderMeetingsText = !empty($olderMeetings)
            ? json_encode($olderMeetings, JSON_PRETTY_PRINT)
            : 'No meetings';

        $prompt = <<<PROMPT
Match the exact meeting date the user is referring to (assume the current year if the year is omitted), and the closest matching title.

Examples:
“yesterday’s standup” → Standup on yesterday’s date
“prod review” → Product Review on the resolved date
“last meeting” → the most recent meeting by date
“weekly sync earlier” → Weekly Sync on the specific date implied
“stand-up” → Standup on the resolved date
“client call” → Client Conference Call on the resolved date
“design mtg” → Design Meeting on the resolved date
If the date cannot be confidently resolved to a single meeting, return null.

Today: {$currentDate}
Yesterday: {$now->copy()->subDay()->format('F j, Y')}

Meetings today:
{$todayMeetingsText}

Meetings yesterday:
{$yesterdayMeetingsText}

Meetings this week:
{$weekMeetingsText}

Older meetings (top 20 most recent from past month):
{$olderMeetingsText}

User query: {$ctx->message}

Return JSON: {"meeting_id": "id or null", "meeting_title": "title", "date": "YYYY-MM-DD", "data_source_id": "id"}
If NO meeting is found:
{
  "meeting_id": null,
  "meeting_title": null,
  "date": null,
  "data_source_id": null
}
PROMPT;

        Log::debug('[Pipeline Step: IdentifyMeetingStep] Prompt', ['prompt' => $prompt]);

        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'meeting_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'meeting_id' => [
                            'type'        => ['string', 'null'],
                            'description' => 'The ID (UUID) of the meeting. Labeled as "id" in the meeting object. Null if no meeting is found.',
                        ],
                        'meeting_title' => [
                            'type'        => ['string', 'null'],
                            'description' => 'The title of the meeting. Labeled as "title" in the meeting object. Null if no meeting is found.',
                        ],
                        'date' => [
                            'type'        => ['string', 'null'],
                            'description' => 'The date of the meeting in YYYY-MM-DD format (e.g., 2025-05-02). Labeled as "date" in the meeting object. Null if no meeting is found.',
                        ],
                        'data_source_id' => [
                            'type'        => ['string', 'null'],
                            'description' => 'The data source ID (UUID) of the meeting. Labeled as "data_source_id" in the meeting object. Null if no meeting is found.',
                        ],
                        'reason' => [
                            'type'        => 'string',
                            'description' => 'The short reason why the meeting matched the user query, or reason why no meeting was found.',
                        ],
                    ],
                    'required' => [
                        'meeting_id',
                        'meeting_title',
                        'date',
                        'data_source_id',
                        'reason',
                    ],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        try {
            $llmStart = microtime(true);
            $response = OpenAIService::createCompletion([
                'model' => 'gpt-4.1-mini',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'response_format' => $schema,
                'temperature' => 0.1,
                'max_tokens' => 200,
            ]);
            $llmTime = microtime(true) - $llmStart;
            $result = json_decode($response['choices'][0]['message']['content'], true);

            Log::info('[Pipeline Step: IdentifyMeetingStep] LLM identification result', [
                'result' => $result,
                'llm_time' => round($llmTime, 3),
            ]);

            if (empty($result['meeting_id'])) {
                Log::warning('[Pipeline Step: IdentifyMeetingStep] LLM did not return a meeting_id', [
                    'result' => $result,
                ]);
                return null;
            }

            $meeting = $meetings->firstWhere('id', $result['meeting_id']);
            if (!$meeting) {
                Log::warning('[Pipeline Step: IdentifyMeetingStep] LLM returned meeting_id but meeting not found in list', [
                    'meeting_id' => $result['meeting_id'],
                    'available_ids' => $meetings->pluck('id')->toArray(),
                ]);
                return null;
            }

            $meetingDate = Carbon::parse($meeting->date);
            
            $meetingInfo = [
                'id' => $meeting->id,
                'meeting_title' => $meeting->title,
                'date' => $meetingDate->format('Y-m-d'),
                'data_source_id' => $meeting->data_source_id,
            ];
            Log::info('[Pipeline Step: IdentifyMeetingStep] Meeting found and matched', $meetingInfo);
            return $meetingInfo;
        } catch (\Throwable $e) {
            Log::warning('[Pipeline Step: IdentifyMeetingStep] LLM identification failed', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function getName(): string
    {
        return class_basename(static::class);
    }
}

