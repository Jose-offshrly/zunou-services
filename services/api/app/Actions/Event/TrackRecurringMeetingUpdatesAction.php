<?php

namespace App\Actions\Event;

use App\Events\TeamMessageSent;
use App\Helpers\PulseHelper;
use App\Models\MeetingSession;
use App\Models\Note;
use App\Models\Pulse;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Services\OpenAIService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TrackRecurringMeetingUpdatesAction
{
    public function handle(MeetingSession $meetingSession)
    {
        $data = $this->extractUpdatesPerPerson($meetingSession->dataSource->transcript, $meetingSession->pulse_id);

        $noteContent = $this->buildResultsForNote($meetingSession, $data);

        $systemUser = PulseHelper::getSystemUser();
        $note = Note::create([
            'title' => $meetingSession->name,
            'content' => $noteContent,
            'pulse_id' => $meetingSession->pulse_id,
            'organization_id' => $meetingSession->organization_id,
            'user_id' => $systemUser->id,
            'pinned' => false,
            'data_source_id' => $meetingSession->dataSource->id,
        ]);

        $teamThread = TeamThread::where('pulse_id', $meetingSession->pulse_id)->where('organization_id', $meetingSession->organization_id)->latest()->first();
        
        $meetingDate = Carbon::parse($meetingSession->start_at)->format('M d');
        
        $messageContent = json_encode([
            'message' => "Here's the summary notes for previous " . $meetingSession->name . " (" . $meetingDate . ") meeting.",
            'ui' => [
                'type' => 'references',
                'references' => [
                    [
                        'title' => $meetingSession->name . ' (' . $meetingDate . ') ' . 'Summary Notes',
                        'id' => $note->id,
                        'type' => 'note',
                    ],
                ],
            ],
        ]);

        $teamMessage = TeamMessage::create([
            'team_thread_id' => $teamThread->id,
            'user_id' => $systemUser->id,
            'reply_team_thread_id' => null,
            'is_parent_reply' => false,
            'content' => $messageContent,
            'metadata' => [],
            'role' => 'assistant',
            'is_system' => false,
            'is_from_pulse_chat' => true,
        ]);

        TeamMessageSent::dispatch($teamMessage);
    }

    private function buildResultsForNote($meetingSession, $data) {
        $html = "<p><strong>{$meetingSession->name}</strong></p>";
        $html .= "<p>{$data['overview']}</p><p><br></p>";

        foreach ($data['individual_updates'] as $update) {
            $html .= "<p><strong>{$update['name']}</strong></p>";
            $html .= "<p><strong>Completed:</strong> {$update['completed']}</p>";
            $html .= "<p><strong>Blockers:</strong> {$update['blockers']}</p>";
            $html .= "<p><strong>Next Steps:</strong> {$update['next_steps']}</p>";
            if (!empty($update['commitments'])) {
                $html .= "<p><strong>Commitments:</strong> {$update['commitments']}</p>";
            }
            $html .= "<p><br></p>";
        }

        return $html;
    }

    private function extractUpdatesPerPerson($transcript, $pulseId)
    {
        $members = Pulse::find($pulseId)->members()->with('user')->get()->map(function ($member) {
            return [
                'name' => $member->user->name,
                'job_description' => $member->job_description ?? null,
                'responsibilities' => $member->responsibilities ? implode(', ', $member->responsibilities) : null,
            ];
        });

        $members = $members->toJson(JSON_PRETTY_PRINT);

        $orgPrompt = <<<PROMPT
Names in the transcript are likely to be misspelled due to transcription errors. Your should **correct these names** by cross-referencing them with the official organization member list provided below:

Official Member List:

{$members}

If a name cannot be confidently matched to a name in the list, it must be left as originally transcribed. Pay attention to common transcription errors, such as:

- Similar-sounding names (e.g., "John" vs. "Jon," "Jane" vs. "Jan").
- Nicknames versus full names (e.g., "Mike" vs. "Michael," "Liz" vs. "Elizabeth").
- Misspelled surnames (e.g., "Smith" vs. "Smit," "Clark" vs. "Clarke").
- Refer also to the job description and responsibilities of the member to help you match the name.
PROMPT;

        $prompt = <<<PROMPT
You are an expert project manager specializing in meeting analysis and task continuity. Your role is to extract structured updates from team meeting transcripts to ensure no tasks are forgotten and all progress is tracked for the next meeting.

CRITICAL INSTRUCTIONS:
1. Extract SPECIFIC, ACTIONABLE information - avoid vague summaries
2. For 'completed' items: List specific tasks, features, or deliverables that were finished
3. For 'blockers': Identify concrete obstacles preventing progress (dependencies, approvals, resources, etc.)
4. For 'next_steps': Extract specific tasks or deliverables that need updates in the next meeting
5. Use 'None' or 'No blockers mentioned' only when explicitly stated or clearly implied
6. Distinguish between TEAM-LEVEL work (cross-functional, organizational) and INDIVIDUAL work
7. Maintain professional, concise language while being specific about deliverables

TEAM vs INDIVIDUAL DISTINCTION:
- Team updates: Sprint planning, releases, infrastructure changes, cross-team dependencies, organizational decisions
- Individual updates: Personal task completion, individual blockers, specific feature work assigned to one person";

Analyze the following meeting transcript and extract structured updates. Focus on ACTIONABLE, SPECIFIC information that helps track progress and prepare for the next meeting.

EXTRACTION GUIDELINES:
- Be specific about what was completed (exact tasks, features, deliverables)
- Clearly identify concrete blockers (what/who is blocking progress)
- Extract specific next steps that need follow-up
- Use person's actual name from transcript
- If no information is provided for a category, state 'Not mentioned' rather than making assumptions

{$orgPrompt}

MEETING TRANSCRIPT:
$transcript

Extract the information using the provided JSON schema, ensuring all text is specific and actionable.
PROMPT;

        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'        => 'meeting_summary',
                'description' => 'Extract structured updates from team meeting transcript with specific, actionable information for meeting continuity',
                'schema'      => [
                    'type'                 => 'object',
                    'properties'           => [
                        'overview' => [
                            'type'        => 'string',
                            'description' => 'Concise summary of the last meeting (completed work, blockers, decisions) plus focus areas and key discussion points for the upcoming meeting. Imagine this is shown 10 minutes before the meeting starts. No styles, just 1 continuous paragraph. Keep it 2-3 sentence only.',
                        ],
                        'individual_updates' => [
                            'type'        => 'array',
                            'description' => 'Updates from individual team members about their specific work and responsibilities',
                            'items'       => [
                                'type'       => 'object',
                                'properties' => [
                                    'name' => [
                                        'type'        => 'string',
                                        'description' => 'Full name of the team member as mentioned in the transcript',
                                    ],
                                    'completed' => [
                                        'type'        => 'string',
                                        'description' => 'Specific tasks, features, or deliverables this person completed: "Implemented user authentication API", "Fixed bug #123", "Completed code review for payment module". Use "Not mentioned" if no completions discussed.',
                                    ],
                                    'blockers' => [
                                        'type'        => 'string',
                                        'description' => 'Specific obstacles preventing this person\'s progress: "Waiting for API documentation from vendor", "Need database access permissions", "Blocked by failing CI tests". Use "No blockers mentioned" if none identified.',
                                    ],
                                    'next_steps' => [
                                        'type'        => 'string',
                                        'description' => 'Specific tasks or deliverables this person needs to report on in next meeting: "Complete payment integration testing", "Deploy user dashboard", "Review security audit results". Use "Not mentioned" if no next steps discussed.',
                                    ],
                                    'commitments' => [
                                        'type'        => 'string',
                                        'description' => 'Specific promises or deadlines this person made: "Will have feature ready by Friday", "Commit to finishing code review by tomorrow", "Will provide deployment update by next meeting". Use "No commitments made" if none stated.',
                                    ],
                                ],
                                'required'             => ['name', 'completed', 'blockers', 'next_steps', 'commitments'],
                                'additionalProperties' => false,
                            ],
                        ],
                    ],
                    'required'             => ['overview', 'individual_updates'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $response = OpenAIService::createCompletion([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
            ],
            'temperature'     => 0.7,
            'response_format' => $schema,
        ]);

        $responseJson = $response->choices[0]->message->content;
        $content = json_decode($responseJson, true);
        return $content;
    }
}