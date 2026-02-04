<?php

namespace App\GraphQL\Mutations;

use App\Models\Event;
use App\Services\OpenAIService;

class CreateEventSummaryMutation
{
    public function __invoke($_, array $args): string
    {
        $event = Event::where('id', $args['eventId'])
            ->where('organization_id', $args['organizationId'])
            ->where('pulse_id', $args['pulseId'])
            ->firstOrFail();

        $summary = $this->createSummary($event);

        return $summary;
    }

    private function createSummary(Event $event): string
    {
        $eventObject = [
            'name'     => $event->name,
            'date'     => $event->date,
            'link'     => $event->link,
            'start_at' => $event->start_at,
            'end_at'   => $event->end_at,
            'location' => $event->location,
            'priority' => $event->priority,
            'guests'   => $event->guests,
        ];

        $event = json_encode($eventObject);

        $prompt = <<<TEXT
You are an assistant that generates natural-language summaries of calendar events.

Given structured event data, write a single-paragraph summary that describes:
- What the event is (based on title and description)
- When it happens (start and end time in 12-hour format with timezone)
- How often it recurs, if applicable
- Where it's held (location)
- Why it’s happening (purpose, from description)
- Who usually attends (attendees list)
Use clear and professional language. Do not format as a template. Just write the summary in natural prose.
Do not start with "Here is the summary of the event", "The event titled" or anything like that. Just start with the summary.

The event is:
$event

Note: the dates are already in the user's timezone.

Return the summary only, no other text.
TEXT;

        $response = OpenAIService::createCompletion([
            'model'    => 'gpt-4.1',
            'messages' => [
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.5,
        ]);

        return $response['choices'][0]['message']['content'];
    }
}
