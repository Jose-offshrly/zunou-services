<?php

namespace App\Actions;

use App\GraphQL\Mutations\CreateNoteMutation;
use App\Models\Note;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CreateSmartNotesAction
{
    /**
     * Handle the creation of smart notes from text input.
     */
    public function handle(
        string $noteText,
        string $pulseId,
        string $organizationId,
        string $userId,
        string $title = null,
    ): Collection {
        // Process the note text to extract smart notes
        $smartNotesData = $this->extractSmartNotes($noteText);

        $createdNotes       = collect();
        $createNoteMutation = new CreateNoteMutation();

        foreach ($smartNotesData as $noteData) {
            // Use provided title if available, otherwise fallback to extracted or default
            $finalTitle = $title ?? ($noteData['title'] ?? 'Untitled Note');
            if (trim($finalTitle) === '') {
                $finalTitle = 'Untitled Note';
            }

            $noteArgs = [
                'id'              => (string) Str::uuid(),
                'title'           => $finalTitle,
                'content'         => $noteData['content'],
                'labels'          => $noteData['labels'] ?? [],
                'pinned'          => $noteData['pinned'] ?? false,
                'pulse_id'        => $pulseId,
                'organization_id' => $organizationId,
                'user_id'         => $userId,
            ];

            $note = $createNoteMutation(null, $noteArgs);
            $createdNotes->push($note);
        }

        return $createdNotes;
    }

    /**
     * Extract smart notes from the input text.
     */
    private function extractSmartNotes(string $noteText): array
    {
        // For now, implement basic text processing
        // This could be enhanced with AI processing later

        $notes = [];

        // Split by lines and look for different patterns
        $lines = array_filter(explode("\n", $noteText), function ($line) {
            return ! empty(trim($line));
        });

        if (empty($lines)) {
            return $notes;
        }

        // If it's a simple single note, create one note
        if (count($lines) <= 3) {
            $title   = $this->extractTitle($lines[0]);
            $content = implode("\n", array_slice($lines, 1));
            if (empty($content)) {
                $content = $lines[0];
                $title   = $this->generateTitleFromContent($content);
            }

            $notes[] = [
                'title'   => $title,
                'content' => $content,
                'labels'  => $this->extractLabels($noteText),
                'pinned'  => $this->shouldBePinned($noteText),
            ];
        } else {
            // For longer text, try to break it into logical sections
            $sections = $this->splitIntoSections($lines);

            foreach ($sections as $section) {
                if (! empty($section['content'])) {
                    $notes[] = [
                        'title'   => $section['title'],
                        'content' => $section['content'],
                        'labels'  => $this->extractLabels($section['content']),
                        'pinned'  => $this->shouldBePinned($section['content']),
                    ];
                }
            }
        }

        return $notes;
    }

    /**
     * Extract title from a line of text.
     */
    private function extractTitle(string $line): string
    {
        // Remove common prefixes and clean the line
        $line = trim($line);
        $line = preg_replace('/^[-•*]\s*/', '', $line);
        $line = preg_replace('/^\d+\.\s*/', '', $line);
        $line = preg_replace('/^#\s*/', '', $line);

        // Limit length
        if (strlen($line) > 50) {
            $line = substr($line, 0, 47) . '...';
        }

        return $line ?: 'Untitled Note';
    }

    /**
     * Generate title from content if no title is available.
     */
    private function generateTitleFromContent(string $content): string
    {
        $content = strip_tags($content);
        $words   = explode(' ', $content);
        $title   = implode(' ', array_slice($words, 0, 8));

        if (strlen($title) > 50) {
            $title = substr($title, 0, 47) . '...';
        }

        return $title ?: 'Untitled Note';
    }

    /**
     * Split text into logical sections.
     */
    private function splitIntoSections(array $lines): array
    {
        $sections       = [];
        $currentSection = ['title' => '', 'content' => ''];

        foreach ($lines as $line) {
            $line = trim($line);

            // Check if this looks like a heading
            if ($this->isHeading($line)) {
                // Save current section if it has content
                if (! empty($currentSection['content'])) {
                    $sections[] = $currentSection;
                }

                // Start new section
                $currentSection = [
                    'title'   => $this->extractTitle($line),
                    'content' => '',
                ];
            } else {
                // Add to current section content
                if ($currentSection) {
                    $currentSection['content'] .= ($currentSection['content'] ? "\n" : '') . $line;
                } else {
                    // No current section, create one
                    $currentSection = [
                        'title'   => $this->generateTitleFromContent($line),
                        'content' => $line,
                    ];
                }
            }
        }

        // Don't forget the last section
        if (! empty($currentSection['content'])) {
            $sections[] = $currentSection;
        }

        return $sections;
    }

    /**
     * Check if a line looks like a heading.
     */
    private function isHeading(string $line): bool
    {
        // Check for common heading patterns
        return preg_match('/^#\s+/', $line) || preg_match('/^\d+\.\s+/', $line) || preg_match('/^[-•*]\s+/', $line) || (strlen($line) < 50 && ! preg_match('/[.!?]$/', $line));
    }

    /**
     * Extract labels from text.
     */
    private function extractLabels(string $text): array
    {
        $labels = [];

        // Look for hashtags
        preg_match_all('/#([a-zA-Z0-9_]+)/', $text, $matches);
        $labels = array_merge($labels, $matches[1]);

        // Look for @mentions as labels
        preg_match_all('/@([a-zA-Z0-9_]+)/', $text, $matches);
        $labels = array_merge(
            $labels,
            array_map(function ($match) {
                return 'mention-' . $match;
            }, $matches[1]),
        );

        return array_unique($labels);
    }

    /**
     * Determine if note should be pinned.
     */
    private function shouldBePinned(string $text): bool
    {
        $urgentWords = ['urgent', 'important', 'priority', 'asap', 'critical'];

        foreach ($urgentWords as $word) {
            if (stripos($text, $word) !== false) {
                return true;
            }
        }

        return false;
    }

    public static function createSmartNotesFromText(string $noteText): array
    {
        $prompt = <<<PROMPT
You are an intelligent assistant that transforms messy or unstructured user notes into a polished, well-organized "smart note."

Your task is to carefully analyze the raw note and generate exactly one smart note object following the structure below. The output should be professional, readable, and presentation-ready — as if a thoughtful teammate rewrote the original note for clarity and internal sharing.
Leverage the capabilities of Markdown to emphasize the most important parts of the note and make it more beautiful by using smart emjis and icons.
Avoid making it boring and bland.
Use the power of Markdown to make it more beautiful and engaging.

Structure:

**title**  
A short, descriptive summary of the note’s main idea or theme.  
- Clear and human-readable  
- Works well as a preview in a list  
- No unnecessary punctuation  
- Examples:  
  - "Q3 Roadmap Highlights"  
  - "Onboarding Feedback Summary"  
  - "Brainstorm: Growth Experiments"

**beautiful_note**  
A clean, markdown-formatted version of the raw note.  
Focus on structure, clarity, and flow.  
Guidelines:
- Break long, messy input into clear sections with headings (use `###` or `####`)
- Use bullet points (`-`) and numbered lists (`1.`, `2.`) only when it improves scannability (e.g., action items, tasks, examples)
- Use emojis for section headers or bullet points when appropriate (✅ 🎯 ❓ etc.)
- Use `>` blockquotes for short callouts or highlights
- Bold important keywords using `**` where helpful
- Do *not* use horizontal rules (`---`)
- The tone should be warm, clear, and informative — not too casual, not too formal

**tags**  
A list of relevant, topic-based tags.  
- Max 5 tags  
- All lowercase, no punctuation  
- Avoid generic terms like "note" or "general"  
- Focus on categories that help filter or search (e.g., "growth", "feedback", "jira", "strategy", "hiring")  
- Format as a JSON array of strings: `["growth", "onboarding", "retention"]`

---

Here is the user-provided raw note:  
$noteText

Now return **exactly one smart note** in the structure above. Do not add comments at the end of the note.
PROMPT;

        $params = [
            [
                'role'    => 'user',
                'content' => $prompt,
            ],
        ];

        $noteSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'smart_notes_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'title' => [
                            'type'        => 'string',
                            'description' => 'The title of the note.',
                        ],
                        'beautiful_note' => [
                            'type'        => 'string',
                            'description' => 'A beautiful, well-formatted version of the note. Follow the rules and guidelines above.',
                        ],
                        'tags' => [
                            'type'  => 'array',
                            'items' => [
                                'type' => 'string',
                            ],
                            'description' => 'A list of meaningful, topic-based tags that help categorize and organize the note.',
                        ],
                    ],
                    'required'             => ['title', 'beautiful_note', 'tags'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $req = [
            'model'           => 'gpt-4.1',
            'messages'        => $params,
            'response_format' => $noteSchema,
            'temperature'     => 0.7,
        ];
        $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
        $response = $openAI->chat()->create($req);
        $newNote  = json_decode(
            $response['choices'][0]['message']['content'],
            true,
        );
        $newNote['note'] = $newNote['beautiful_note'];
        unset($newNote['beautiful_note']);
        return $newNote;
    }
}
