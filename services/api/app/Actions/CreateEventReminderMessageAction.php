<?php

namespace App\Actions;

use App\Models\Event;
use App\Models\User;
use App\Services\RunStandAloneAgent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CreateEventReminderMessageAction
{
    public static function execute(
        string $organizationId,
        string $pulseId,
        User $user,
        ?array $eventsFocus = [],
        ?array $eventsConsider = [],
        ?array $dateRangeFocus = [],
        ?array $dateRangeConsider = [],
        ?string $context = null,
    ): string {
        $userTimeZone = $user->timezone;

        try {
            if (empty($eventsFocus)) {
                $focusedEvents = self::getEventsForDay(
                    $userTimeZone,
                    0,
                    $user->id,
                );
                $focusedEvents = self::normalizeEventsData(
                    $focusedEvents,
                    $userTimeZone,
                );
            } else {
                $focusedEvents = self::normalizeEventsData(
                    $eventsFocus,
                    $userTimeZone,
                );
            }
            $focusedEventsPrompt = ! empty($focusedEvents)
                ? json_encode($focusedEvents)
                : 'No events found for this period.';

            if (empty($eventsConsider)) {
                $considerEventsYesterday = self::getEventsForDay(
                    $userTimeZone,
                    -1,
                    $user->id,
                );
                $considerEventsTomorrow = self::getEventsForDay(
                    $userTimeZone,
                    1,
                    $user->id,
                );
                $considerEvents = $considerEventsYesterday->merge(
                    $considerEventsTomorrow,
                );
                $considerEvents = self::normalizeEventsData(
                    $considerEvents,
                    $userTimeZone,
                    'consider',
                );
            } else {
                $considerEvents = self::normalizeEventsData(
                    $eventsConsider,
                    $userTimeZone,
                    'consider',
                );
            }

            $considerEventsPrompt = ! empty($considerEvents)
                ? json_encode($considerEvents)
                : 'No events found for this period.';

            $prompt = <<<TEXT
I need you to generate an intelligent, contextual reminder message for me right now. Act as my smart personal assistant who understands my workflow, priorities, and helps me stay on top of what matters most.

What I Need From You

I'm providing you with two types of events aka meetings:
- **Focus Events**: The events i should be prioritizing atm, This is my focus at the current date time.
- **Consider Events**: These are events that might be related or important to focus events. Imagine a recurring meeting, today's event is focus but the previous event is consider.

**Focus Events**:
{$focusedEventsPrompt}

**Consider Events**:
{$considerEventsPrompt}

Please synthesize this information into a single, natural paragraph, Always pass the complete information to the agent.
Pass the json event in tools and agents this is to avoid confusion and unnecessary lookup.

---

How I want the events to be used to generate the reminder message:

- Focus on the focus events, check how am i doing so far with these events, if i have completed any of them, check if there are any follow up actions or outcomes that i need to do or bring up in the next meeting.
- Use the consider events to understand the events before and after the focus events, this will give you idea of the past events related to the focus events.
- **Important**: This is MY personalized reminder - only extract information relevant to ME (todays updates, my blockers, my tasks, my action items). I don't care about team-wide issues that don't affect me directly. 
- Use the similar event to be considered as a reference to the focus event. Not necessarily the direct previous event. Also make sure to query that events if data source is available.

**Examples:**

1. **Recurring Meeting Context**: If previous standup is a consider event, query that event using the data source id to get the blockers, carry over, pending tasks and other important information that i need to be reminded of for today's standup.
2. **Weekly Planning**: Imagine today is Friday but still a lot of work to do, you can remind me to prioritize urgent tasks so that next week I can focus on minor tasks.
3. **Preparation Context**: If today's focus event is "Client Demo Prep" and consider events show "Client Demo" tomorrow, remind me that today's prep is crucial for tomorrow's presentation and suggest key areas to focus on.
4. **Follow-up Actions**: If yesterday's "Sprint Review" (consider event) had action items and today's focus event is "Development Work", remind me about specific blockers or decisions from yesterday that affect today's coding tasks.
5. **Meeting Dependencies**: If focus event is "Pre-meeting with stakeholders" and consider events show "Board Presentation" next week, connect that today's pre-meeting is gathering input for the bigger presentation.
6. **Status Updates**: If focus event is "Project Status Call" and consider events show related project meetings from this week, summarize key progress or issues I should mention in the status call.

---

**Output Requirements:**
- Single natural paragraph, personal assistant tone (clear, informative, human).
- Keep the reminder message short and concise. Maximum of 3 sentences.
- Return the message only — no preamble, no “Here’s your summary,” no follow-up questions or instructions.
- Be selective - focus on what matters most RIGHT NOW
- Don't list events mechanically, connect relationships intelligently
- Stick to provided events only, don't assume information not provided
- **PERSONALIZED FOR ME**: Focus on MY blockers, MY carry-overs, MY action items - I don't care about others, only what affects me directly

**Additional context I'm providing (respect any formatting or output preferences I mention here):**
{$context}

---

Generate the intelligent reminder message now.
TEXT;

            Log::debug($prompt);
            $runStandAloneAgent = new RunStandAloneAgent(
                $pulseId,
                $organizationId,
                $user->id,
            );
            $response = $runStandAloneAgent->run(
                collect([
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ]),
            );

            return $response;
        } catch (\Throwable $e) {
            Log::error(
                "[CreateEventReminderMessageAction] Error: {$e->getMessage()}",
                [
                    'trace' => $e->getTraceAsString(),
                    'file'  => $e->getFile(),
                ],
            );
        }

        return 'No reminders for today';
    }

    public static function getEventsForDay(
        string $userTimeZone,
        int $offsetDays,
        string $userId,
    ) {
        $startOfDay = Carbon::today($userTimeZone)
            ->addDays($offsetDays)
            ->startOfDay();
        $endOfDay = $startOfDay->copy()->endOfDay();

        $startUtc = $startOfDay->copy()->setTimezone('UTC');
        $endUtc   = $endOfDay->copy()->setTimezone('UTC');

        return Event::whereBetween('start_at', [$startUtc, $endUtc])
            ->orderBy('start_at', 'asc')
            ->where('user_id', $userId)
            ->get();
    }

    private static function normalizeEventsData(
        $events,
        $userTimeZone,
        $eventsType = 'focus',
    ) {
        if (empty($events)) {
            return [];
        }

        if (is_array($events) && is_string($events[0])) {
            $events = Event::whereIn('id', $events)
                ->orderBy('start_at', 'asc')
                ->get();
        }

        $currentDatetime = Carbon::now($userTimeZone);

        $normalizedEvents = $events->map(function ($event) use (
            $userTimeZone,
            $currentDatetime,
            $eventsType
        ) {
            $startAtUtc          = Carbon::parse($event->start_at, 'UTC');
            $startAtUserTimeZone = $startAtUtc->setTimezone($userTimeZone);

            $endAtUtc          = Carbon::parse($event->end_at, 'UTC');
            $endAtUserTimeZone = $endAtUtc->setTimezone($userTimeZone);

            $status = self::getStatus($event, $userTimeZone, $currentDatetime);

            $returnData = [
                'data_source_id' => $event->meetingSession?->data_source_id ?? 'No data source yet - skip query',
                'title'          => $event->name,
                'status'         => $status,
                'date'           => self::getDateLabel($event->date, $userTimeZone),
                'when'           => Carbon::parse($event->start_at, 'UTC')
                    ->setTimezone($userTimeZone)
                    ->diffForHumans($currentDatetime, [
                        'parts'  => 2,
                        'short'  => false,
                        'syntax' => Carbon::DIFF_RELATIVE_TO_NOW,
                    ]),
                'start_at'    => $startAtUserTimeZone->toIso8601String(),
                'end_at'      => $endAtUserTimeZone->toIso8601String(),
                'guests'      => $event->guests,
                'description' => $event->description,
                'location'    => $event->location ?? 'online',
            ];

            if ($status === 'Done') {
                $dataSource = $event->meetingSession?->dataSource;
                if ($dataSource) {
                    try {
                        $summary                  = $dataSource->summary;
                        $summary                  = json_decode($summary, true);
                        $returnData['overview']   = $summary['overview'];
                        $returnData['transcript'] = 'use the data source id to get the transcript';
                    } catch (\Throwable $th) {
                        $returnData['overview']   = 'No overview available';
                        $returnData['transcript'] = 'No transcript available';
                    }
                } else {
                    $returnData['overview']   = 'No overview available';
                    $returnData['transcript'] = 'No transcript available';
                }
            } else {
                $returnData['overview'] = 'No overview yet - skip query';
            }

            if ($eventsType === 'focus') {
                $returnData['agenda_items']   = $event->agendas->pluck('name');
                $returnData['talking_points'] = $event->checklists->map(
                    function ($checklist) {
                        $isComplete = $checklist->complete
                            ? 'completed'
                            : 'pending';
                        return implode(' - ', [$checklist->name, $isComplete]);
                    },
                );
            }

            return $returnData;
        });

        return $normalizedEvents;
    }

    private static function getDateLabel($datetime, $userTimeZone)
    {
        $date  = Carbon::parse($datetime, 'UTC')->setTimezone($userTimeZone);
        $today = Carbon::today($userTimeZone);

        if ($date->isSameDay($today)) {
            return 'Today';
        } elseif ($date->isSameDay($today->copy()->subDay())) {
            return 'Yesterday';
        } elseif ($date->isSameDay($today->copy()->addDay())) {
            return 'Tomorrow';
        }

        return $date->isoFormat('ddd, MMM D');
    }

    private static function getStatus(
        Event $event,
        string $userTimeZone,
        Carbon $currentTime,
    ) {
        $start = Carbon::parse($event->start_at, 'UTC')->setTimezone(
            $userTimeZone,
        );
        $end = Carbon::parse($event->end_at, 'UTC')->setTimezone($userTimeZone);

        if ($end->lt($currentTime)) {
            $status = 'Done';
        } elseif ($start->lte($currentTime) && $end->gte($currentTime)) {
            $status = 'happening now';
        } else {
            $status = 'upcoming';
        }

        return $status;
    }
}
