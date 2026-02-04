<?php

namespace App\Services;

use App\Models\Pulse;
use Illuminate\Support\Facades\Config;

class FirefliesMeetingProcessorService
{
    public function generateSummaryInMarkdownFormat(string $content, ?string $pulseId = null)
    {
        $responseSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'summary_schema',
                'schema' => [
                    'type'     => 'object',
                    'required' => [
                        'title',
                        'organizer',
                        'date',
                        'duration',
                        'keywords',
                        'overview',
                        'strategies',
                        'attendees',
                        'tldr',
                        'sentiment',
                    ],
                    'properties' => [
                        'id' => [
                            'type'        => ['string', 'null'],
                            'description' => 'Unique identifier for the meeting',
                        ],
                        'title' => [
                            'type'        => 'string',
                            'description' => 'Title of the meeting',
                        ],
                        'organizer' => [
                            'type'       => 'object',
                            'properties' => [
                                'email' => [
                                    'type'        => 'string',
                                    'format'      => 'email',
                                    'description' => "Organizer's email address",
                                ],
                                'name' => [
                                    'type'        => 'string',
                                    'description' => "Organizer's full name",
                                ],
                                'avatar' => [
                                    'type'        => ['string', 'null'],
                                    'format'      => 'uri',
                                    'description' => "URL of the organizer's avatar image",
                                ],
                            ],
                            'required'    => ['email', 'name'],
                            'description' => 'Information about the meeting organizer',
                        ],
                        'date' => [
                            'type'        => 'string',
                            'format'      => 'date-time',
                            'description' => 'Date and time when the meeting is scheduled',
                        ],
                        'duration' => [
                            'type'        => 'integer',
                            'description' => 'Duration of the meeting in minutes',
                        ],
                        'meeting_link' => [
                            'type'        => ['string', 'null'],
                            'format'      => 'uri',
                            'description' => 'Link to the virtual meeting',
                        ],
                        'transcript_url' => [
                            'type'        => ['string', 'null'],
                            'format'      => 'uri',
                            'description' => 'URL where the meeting transcript is stored',
                        ],
                        'participants' => [
                            'type'  => 'array',
                            'items' => [
                                'type'        => 'string',
                                'description' => "Participant's name or identifier",
                            ],
                            'description' => 'List of participants in the meeting',
                        ],
                        'overview' => [
                            'type'     => 'array',
                            'maxItems' => 10,
                            'items'    => [
                                'type'        => 'string',
                                'description' => 'A 2–3 sentence summary of one key discussion point or topic covered in the meeting.',
                            ],
                            'description' => 'List of key discussion points from the meeting, each written as a clear and self-contained 2–3 sentence summary.',
                        ],
                        'keywords' => [
                            'type'  => 'array',
                            'items' => [
                                'type'        => 'string',
                                'description' => 'Important key term, technical term, business term, or domain-specific concept that is central to the meeting discussion',
                            ],
                            'description' => 'List of important key terms, technical terms, business terms, and domain-specific terminology that are central to the meeting. Exclude generic keywords and common words.',
                        ],
                        'strategies' => [
                            'type'  => 'array',
                            'items' => [
                                'type'        => 'string',
                                'description' => 'Strategy that can be applied in the meeting context',
                            ],
                            'minItems'    => 3,
                            'maxItems'    => 4,
                            'description' => 'Key Strategies that can be applied based on meeting content',
                        ],
                        'attendees' => [
                            'type'  => 'array',
                            'items' => [
                                'type'        => 'string',
                                'description' => 'Attendee name. This is the name of the person who attended the meeting. Retrieve all attendees from the meeting content.',
                            ],
                            'description' => 'List of attendees in the meeting',
                        ],
                        'tldr' => [
                            'type'        => 'string',
                            'description' => 'Generate a concise tl;dr of the meeting in 2–3 sentences, highlighting key topics, major decisions, and the overall flow of discussion.',
                        ],
                        'sentiment' => [
                            'type'        => 'string',
                            'description' => 'generate a single lowercase sentiment word that best describes the overall meeting tone. Choose from these examples or create your own that fits better: collaborative, productive, tense, energetic, constructive, frustrated, rushed, positive, heated, focused, chaotic, professional, creative, disagreeable, harmonious, intense, calm, dynamic, stressful, efficient.',
                        ],
                    ],
                    'additionalProperties' => false,
                ],
            ],
        ];

        $orgPrompt = "";

        if ($pulseId) {
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
        }

        $prompt = <<<PROMPT
You are a smart and structured AI assistant designed to extract meaningful, well-formatted summaries from meeting transcripts.

Please read the transcript below and return a structured JSON object following the defined schema. Ensure the output is complete and based only on the information provided in the transcript.

Output must:
- Use the **schema strictly** (do not invent extra fields).
- Only include values directly supported by the transcript.
- For any missing data, return `null` or leave the field out if optional.
- Break **overview** into multiple clear bullet points or short paragraphs.
- Include 3–4 **strategies** that are relevant, actionable, and grounded in the meeting content.
- Extract **keywords** as important key terms, technical terms, business terms, or domain-specific concepts only. Exclude generic keywords and common words.

{$orgPrompt}

Transcript:

{$content}
PROMPT;

        $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
        $response = $openAI->chat()->create([
            'model'           => Config::get('zunou.openai.model'),
            'messages'        => [['role' => 'user', 'content' => $prompt]],
            'n'               => 1,
            'response_format' => $responseSchema,
        ]);

        return $response['choices'][0]['message']['content'];
    }
}
