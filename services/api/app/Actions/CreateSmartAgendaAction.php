<?php

namespace App\Actions;

use App\Models\Agenda;
use App\Models\Event;
use App\Models\Organization;
use App\Models\Pulse;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CreateSmartAgendaAction
{
    /**
     * Handle the creation of a smart agenda.
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

        // Generate a smart agenda name based on the event
        $agendaItems = $this->generateSmartAgenda($event);

        // Create the agenda
        $agendas = collect();
        foreach ($agendaItems as $agendaItem) {
            $agenda = Agenda::create([
                'id'              => Str::uuid(),
                'name'            => $agendaItem,
                'pulse_id'        => $pulseId,
                'organization_id' => $organizationId,
                'event_id'        => $eventId,
                'event_instance_id' => $eventInstanceId,
            ]);
            $agendas->push($agenda);
        }

        return $agendas;
    }

    /**
     * Generate a smart agenda name based on the event.
     */
    private function generateSmartAgendaName(Event $event): string
    {
        $eventName = $event->name ?? 'Event';

        // Generate a smart agenda name with AI-like logic
        $agendaName = "Smart Agenda for {$eventName}";

        // Add date context if available
        if ($event->date) {
            $eventDate = $event->date;
            $agendaName .= " - {$eventDate}";
        }

        return $agendaName;
    }

    /**
     * Generate a smart agenda based on the event.
     */
    private function generateSmartAgenda(Event $event): array
    {
        $eventInformation = $event->toJson();
        $prompt           = <<<PROMPT
You are an intelligent assistant tasked with creating effective meeting agendas based on calendar event information.

Your goal is to generate a relevant, well-organized agenda for the meeting, using only the provided event data. Think carefully and consider the meeting’s title, purpose, participants, and context when drafting agenda items.

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

## 🔹 Your Task
Based on the information above, generate a smart, well-structured agenda for the meeting. Follow these rules:

1. Include **3–6 agenda items**, depending on available context.
2. Use **bullet points or numbered format**.
3. Ensure each item is specific, relevant, and aligned with the meeting’s purpose.
4. Refer to participants and roles if applicable (e.g., "Update from Design team", "Client feedback discussion").
5. If prior meeting notes are present, include carry-over items or unresolved discussions.
6. Avoid generic filler like "Miscellaneous" or "Any other business" unless clearly appropriate.

---

## Output Format
Return only the list of generated agenda as plain text, like this:

Agenda:

- Project status update from all team leads
- Review outstanding bugs from last sprint
- Discuss timeline for feature rollout
- Client feedback — open issues and follow-ups

## Event Information
{$eventInformation}

Start generating the agenda.
PROMPT;

        $agendaSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'agenda_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'agenda_items' => [
                            'type'  => 'array',
                            'items' => [
                                'type' => 'string',
                            ],
                        ],
                    ],
                    'required'             => ['agenda_items'],
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

        return $result['agenda_items'] ?? [];
    }
}
