<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Event;
use App\Services\OpenAIService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

final readonly class GenerateEventBreakMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {

        if (!isset($args['previousEventId']) || !isset($args['nextEventId'])) {
            throw new \Exception('Previous or next event not provided');
        }

        $previousEvent = Event::find($args['previousEventId']);
        $previousEventGuestsCount = count($previousEvent->guests ?? []);

        $nextEvent = Event::find($args['nextEventId']);
        $nextEventGuestsCount = count($nextEvent->guests ?? []);

        $eventGapMinutes = Carbon::parse($previousEvent->end_at)->diffInMinutes(Carbon::parse($nextEvent->start_at));
        $gapLabel = $this->formatGapLabel($eventGapMinutes);


        $prompt = <<<PROMPT
        Suggest a very short, creative, and actionable activity for a $gapLabel break between two meetings. Suggest on meeting preparations or coffee breaks.
            \n"Before the break": $previousEvent->title ($previousEvent->location, $previousEventGuestsCount guests).
            \n"After the break": $nextEvent->title ($nextEvent->location, $nextEventGuestsCount guests).
            \nRespond in the format: '$gapLabel break—[activity]'. Avoid repeating the same type of activity.
        PROMPT;

        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'extract_entities',
                'schema' => [
                    'type'                 => 'object',
                    'properties'           => [
                        'break_suggestion' => [
                            'type' => 'string',
                            'description'  => 'A preparatory activity suggestion before the next event for a ${gapLabel} break, in the format: \'' . $gapLabel . ' break—[activity]\''
                        ]
                    ],
                    'required'             => ['break_suggestion'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $maxRetries = 3;
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $response = OpenAIService::createCompletion([
                    'model'    => config('zunou.openai.model'),
                    'messages' => [
                        [
                            'role'    => 'system',
                            'content' => $prompt,
                        ],
                    ],
                    'n'               => 1,
                    'response_format' => $schema,
                ]);

                $responseJson = $response->choices[0]->message->content;
                $responseData = json_decode($responseJson, true);

                return $responseData['break_suggestion'];
            } catch (\Exception $e) {
                $lastException = $e;
                Log::error('Error generating event break message: ' . $e->getMessage());
                if ($attempt < $maxRetries) {
                    continue;
                }
            }
        }

        throw $lastException;
    }

    private function formatGapLabel($gapMinutes) {
        if ($gapMinutes >= 60) {
            $hours = floor($gapMinutes / 60);
            $mins = $gapMinutes % 60;
    
            if ($mins === 0) {
                return $hours === 1 ? "1 hour" : "{$hours} hours";
            } else {
                $decimalHours = $gapMinutes / 60;
                return $decimalHours == 1.0 
                    ? "1 hour" 
                    : number_format($decimalHours, 1) . " hours";
            }
        } else {
            $roundedMinutes = round($gapMinutes);
            return $roundedMinutes === 1 ? "1 minute" : "{$roundedMinutes} minutes";
        }
    }
    
}
