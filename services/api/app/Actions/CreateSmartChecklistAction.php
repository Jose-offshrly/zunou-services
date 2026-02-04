<?php

namespace App\Actions;

use App\Models\Checklist;
use App\Models\Event;
use App\Models\Organization;
use App\Models\Pulse;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CreateSmartChecklistAction
{
    /**
     * Handle the creation of a smart checklist.
     */
    public function handle(
        string $pulseId,
        string $organizationId,
        ?string $eventId = null,
        ?string $eventInstanceId = null,
    ): Collection {
        // Validate the pulse exists
        $pulse = Pulse::findOrFail($pulseId);

        // Validate the organization exists
        $organization = Organization::findOrFail($organizationId);

        // Get the event - either directly or through event instance
        $event = null;
        if ($eventId) {
            $event = Event::findOrFail($eventId);
        } elseif ($eventInstanceId) {
            $eventInstance = \App\Models\EventInstance::findOrFail($eventInstanceId);
            $event = $eventInstance->event;
        } else {
            throw new \InvalidArgumentException('Either event_id or event_instance_id must be provided.');
        }

        // Generate a smart checklist name based on the event
        $checklists = $this->generateSmartChecklist($event);

        $checkListsCollection = collect();
        foreach ($checklists as $checklist) {
            // Create the checklist
            $checklist = Checklist::create([
                'id'              => Str::uuid(),
                'name'            => $checklist,
                'complete'        => false,
                'pulse_id'        => $pulseId,
                'organization_id' => $organizationId,
                'event_id'        => $eventId,
                'event_instance_id' => $eventInstanceId,
            ]);
            $checkListsCollection->push($checklist);
        }

        return $checkListsCollection;
    }

    /**
     * Generate a smart checklist name based on the event.
     */
    private function generateSmartChecklist(Event $event): array
    {
        $agendas = $event->agendas;
        if ($agendas->count() > 0) {
            $agendas = $agendas->map(function ($agenda) {
                return $agenda->name;
            });
            $agendas = $agendas->join("\n");
        } else {
            $agendas = 'No agendas set for this event at the moment.';
        }

        $eventInformation = $event->toJson();
        $prompt           = <<<PROMPT
You are an intelligent assistant tasked with creating effective meeting checklists based on calendar event information.

Your goal is to generate a relevant, well-organized checklist for the meeting, using only the provided event data. Think carefully and consider the meeting’s title, purpose, participants, and context when drafting checklist items.

---

## 🔹 Event Input
You will receive structured event information, including:
- `title`: The event name or subject
- `description`: Optional notes or meeting purpose
- `start_at` / `end_at`: Start and end time of the meeting
- `participants`: List of attendee names (and optionally, roles)
- `location` or `link`: Meeting link or physical location
- `tags` or `type`: Optional labels like "stand-up", "sprint planning", "client sync", etc.
- `previous_notes` (optional): Notes or action items from the last meeting, if this is a recurring event

---

## 🔹 Agendas
{$agendas}

---

## 🔹 Your Task
Based on the information above, generate a smart, well-structured checklist for the meeting. Follow these rules:

1. Include **3–6 checklist items**, depending on available context. Can be more depending on the context. Include all the items that are relevant to the meeting.
2. Ensure each item is specific, relevant, and aligned with the meeting’s purpose.
3. Refer to participants and roles if applicable (e.g., "Update from Design team", "Client feedback discussion").
4. If prior meeting notes are present, include carry-over items or unresolved discussions.
5. Agendas should be included in the checklist as well.

---

## Output Format
Return only the list of generated checklist items as plain text, like this:

Checklist:

- Prepare meeting agenda and materials
- Confirm attendance of all participants
- Set up meeting room or virtual link
- Review previous meeting notes and action items
- Assign roles (facilitator, note-taker, timekeeper)
- Ensure all required documents are accessible

## Event Information
{$eventInformation}

Start generating the checklist.
PROMPT;

        $agendaSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'checklist_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'checklist_items' => [
                            'type'  => 'array',
                            'items' => [
                                'type' => 'string',
                            ],
                        ],
                    ],
                    'required'             => ['checklist_items'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $params = [
            [
                'role'    => 'user',
                'content' => $prompt,
            ],
        ];

        $req = [
            'model'           => 'gpt-4.1',
            'messages'        => $params,
            'response_format' => $agendaSchema,
            'temperature'     => 0.7,
        ];
        $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
        $response = $openAI->chat()->create($req);
        $result   = json_decode(
            $response['choices'][0]['message']['content'],
            true,
        );

        return $result['checklist_items'] ?? [];
    }
}
