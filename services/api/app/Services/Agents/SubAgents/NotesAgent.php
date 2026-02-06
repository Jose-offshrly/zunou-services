<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\GraphQL\Mutations\CreateNoteMutation;
use App\Models\Note;
use App\Models\User;
use App\Schemas\BaseSchema;
use App\Services\Agents\Tools\NoteTools;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class NotesAgent extends BaseSubAgent implements SubAgentInterface
{
    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::ReferencesSchema,
            BaseSchema::ConfirmationSchema,
            BaseSchema::OptionsSchema,
        ]);
    }

    public function getSystemPrompt(): string
    {
        $basePrompt = $this->getSharedPrompt();

        return <<<EOD
You are Notes Agent. You are expert in taking notes, querying notes and managing notes.

Pulse ID: {$this->pulse->id}

---

{$basePrompt}

---

## Note Format

By default, when formatting notes for the user, follow this structure:

```markdown
1. Project Plan 1   
    Setup roadmap, define backlog   
    Tags: `planning`, `roadmap` • Updated 3 days ago

2. Project Plan 2 • Updated 3 days ago
```
As you can see, the content and tags are optional, you can omit it if not relevant.
Notes varies in terms of content but maintain that kind of structure.

- Include:
  - A numbered index if multiple notes are created, listed or updated.
  - Title
  - Content
  - Tags or labels (formatted compactly, e.g. `planning, roadmap`)
  - Relative last updated time (e.g., "2 days ago")

## Note Content are HTML

All note contents must be returned as valid HTML suitable for rendering inside a rich-text editor or HTML viewer. Avoid markdown formatting. Wrap lists in `<ul>`/`<li>`, bold in `<strong>`, and use proper HTML tags instead of markdown symbols. Each paragraph or text block must be wrapped in `<p>` tags for consistent display.

Wrap:
- Text blocks in `<p>` tags.
- Bullet points using `<ul>` and `<li>`.
- Bold text with `<strong>`, italic with `<em>`, underline with `<u>`, and strikethrough with `<s>`.
- Use `<br>` only for intentional line breaks.

Strictly Supported HTML Tags:
<p>, <ul>, <li>, <strong>, <em>, <u>, <s>, <br>

Do not use any other tags. Avoid headings, tables, media embeds, inline styles, or any unsupported elements. Ensure the HTML is clean, minimal, and properly closed.

## Communicate With User Using UI Elements

You can communicate with the user using UI elements.

- references - this is used to show the user the references to the notes or note list. Always use this whenever notes is created, updated or listed. This makes the navigation and viewing of the notes easier for the user.
Important note: When displaying references, always display the note in main content. References is just a references not the main content.
- Options - whenever there are multiple options available, use this to show the user the options. Don't assume what the user wantsor make up options, always use the options provided by the tool.
- Confirmation - this is used to confirm the user's action. This can be also used an option if found results are single.
Important note: for single options or suggested action that is answerable by yes or no, you can use confirmation ui. Examples: "This notes doesn't exist, do you want to create it?"
No need to confirm again if message comes from this ui elements. meaning if the message is clicked from the references, options or confirmation, do not ask for confirmation again, Thats already confirmed.

## Tools Guidelines
Always call the relevent tools to get the most accurate and up to date information.
Notes can be deleted, updated, pinned, unpinned, etc. without your knowledge. Meaning user do it in himself manually.
Always call these tools even query is repeated: 
- createNotes
- queryNotes

Here are the built-in tools:

1. queryNotes
**Purpose**  
Retrieve detailed information about notes. This is used to fetch the full context — including title, content, labels, pinned status, and creation/update dates.
Always call this tool whenever searching or listing notes.

**Usage**  
Call this tool in the following scenarios:

- When the user asks to **view**, **search**, **list**, or **find** notes. This ensures full context is available for response formatting.
- When the user says things like:
  - "Show me my pinned notes"
  - "Search for notes about marketing"
  - "Find notes from last week" 
  - "List all my notes"

The tool returns all matching notes with their full details.
If the user is trying to get notes via relative date, example today, yesterday and so on, convert it to the absolute date format. Refer to the current date and time.
If no notes found, retrieve the latest notes as suggestion.

2. getNoteDetails
**Purpose**  
Retrieve detailed information about a single note. This is used to fetch the full context — including title, content, labels, pinned status, and creation/update dates.
Always call this tool whenever user passed in note name or note id.

**Usage**  
Call this tool in the following scenarios:

- When the user asks to **view**, **summarize**, **explain**, or **get help** with a specific note. This ensures full context is available for response formatting.
- When the user says things like:
  - "Show me the details of note [id]"
  - "Summarize the Project Plan note"
  - "What is the content of my marketing note?"
  - "Help me understand what's in this note"

**Parameters**:
- `id`: The UUID of the note to retrieve details for

The tool returns the complete note information including all metadata.

Strictly follow mentioned rules and guidelines.
EOD;
    }

    public function getFunctionCalls(): array
    {
        $tools = [
            NoteTools::createNotes,
            NoteTools::queryNotes,
            NoteTools::updateNotes,
            NoteTools::deleteNote,
            NoteTools::getNoteDetails,
        ];

        if ($this->allowedTools !== null && is_array($this->allowedTools)) {
            $tools = array_values(
                array_filter($tools, function ($item) {
                    $fnName = $item['function']['name'];
                    return in_array($fnName, $this->allowedTools);
                }),
            );
        }

        return $this->mergeFunctionCalls($tools);
    }

    /**
     * Handle function calls specific to Admin agents.
     *
     * @param string $functionName
     * @param array $arguments
     * @param mixed $orgId
     * @param mixed $pulseId
     * @param mixed $threadId
     * @param mixed $messageId
     * @return string
     *
     */

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info("[Notes Agent] {$functionName}  called", $arguments);

        switch ($functionName) {
            case 'createNotes':
                $arguments['pulse_id']        = $pulseId;
                $arguments['organization_id'] = $orgId;
                $arguments['user_id']         = $this->user->id;
                $arguments['labels']          = $arguments['labels'] ?? [];
                $arguments['paths']           = $arguments['paths']  ?? [];

                if ($this->recommendation) {
                    $this->saveRecommendationAction(
                        'note',
                        'create',
                        $arguments
                    );
                    $note = (object) $arguments;
                } else {
                    $noteCreator = new CreateNoteMutation();
                    $note        = $noteCreator(null, $arguments);
                }

                return 'created note successfully. Here are the details: ' .
                    json_encode($note);

            case 'queryNotes':
                $query = Note::query()
                    ->with('labels')
                    ->where('pulse_id', $pulseId)
                    ->where('organization_id', $orgId);

                if (! empty($arguments['pinned'])) {
                    $query->where('pinned', true);
                }

                if (! empty($arguments['search_keywords'])) {
                    $searchTerms = collect($arguments['search_keywords'])
                        ->filter()
                        ->map(function ($phrase) {
                            $tokens = preg_split('/\s+/', trim($phrase));
                            $invalid = ['!', '(', ')', ':', '>', '<'];
                            return implode(' & ', array_map(function ($t) use ($invalid) {
                                // Replace all invalid characters with space
                                $t = str_replace($invalid, ' ', $t);
    
                                // If replacement happened and word contains spaces, wrap in single quotes
                                if (preg_match('/\s/', $t)) {
                                    $t = "'" . $t . "'";
                                }
                                return $t . ':*';
                            }, $tokens));
                        })
                        ->implode(' | ');
                
                    $query->select('*')
                        ->selectRaw("
                            GREATEST(
                                ts_rank(to_tsvector('english', title), to_tsquery('english', ?)),
                                ts_rank(to_tsvector('english', content), to_tsquery('english', ?))
                            ) AS relevance
                        ", [$searchTerms, $searchTerms])
                        ->where(function ($q) use ($searchTerms) {
                            $q->orWhereRaw("to_tsvector('english', title) @@ to_tsquery('english', ?)", [$searchTerms])
                              ->orWhereRaw("to_tsvector('english', content) @@ to_tsquery('english', ?)", [$searchTerms]);
                        })
                        ->orderByDesc('relevance');
                }

                if (! empty($arguments['created_at_range'])) {
                    $query->whereBetween('created_at', [
                        Carbon::parse(
                            $arguments['created_at_range']['from'],
                        )->startOfDay(),
                        Carbon::parse(
                            $arguments['created_at_range']['to'],
                        )->endOfDay(),
                    ]);
                }

                $query->orderBy('created_at', 'desc');

                $notes = $query->get();
                return 'queried notes successfully. Here are the details: ' .
                    json_encode($notes);

            case 'updateNotes':
                $note = Note::find($arguments['id']);
                if (! $note) {
                    return 'Note not found, make sure to get the correct note first then call the tool again.';
                }

                if ($this->recommendation) {
                    $this->saveRecommendationAction(
                        'note',
                        'update',
                        $arguments
                    );
                } else {
                    $updates = [];

                    if (!empty($arguments['title'])) {
                        $updates['title'] = $arguments['title'];
                    }

                    if (!empty($arguments['content'])) {
                        $updates['content'] = $arguments['content'];
                    }

                    if (isset($arguments['pinned'])) {
                        $updates['pinned'] = $arguments['pinned'];
                    }

                    if (!empty($updates)) {
                        $note->update($updates);
                    }
                  
                    $noteMutator = new CreateNoteMutation();
                    if (!empty($arguments['labels_to_add'])) {
                        $noteMutator->attachLabels($note, $arguments['labels_to_add']);
                    }

                    if (!empty($arguments['labels_to_remove'])) {
                        $noteMutator->detachLabels($note, $arguments['labels_to_remove']);
                    }

                    if (isset($arguments['remove_all_labels']) && $arguments['remove_all_labels']) {
                        $noteMutator->detachAllLabels($note);
                    }
                }

                return 'updated note successfully. Here are the details: ' .
                    json_encode($note->fresh());

            case 'deleteNote':
                try {
                    $ids = $arguments['ids'] ?? [];
                    $validator = Validator::make(
                        ['ids' => $ids],
                        [
                            'ids'   => 'required|array|min:1',
                            'ids.*' => 'required|uuid',
                        ]
                    );
                    if ($validator->fails()) {
                        return 'One or more IDs are not valid UUIDs.';
                    }

                    $notes = Note::whereIn('id', $ids)
                        ->where('organization_id', $orgId)
                        ->where('pulse_id', $pulseId)
                        ->get();

                    if ($notes->count() !== count($ids)) {
                        return 'One or more IDs do not exist in the database, make sure to get the correct note first and ask for confirmation first then call the tool again.';
                    }

                    if ($this->recommendation) {
                        $this->saveRecommendationAction(
                            'note',
                            'delete',
                            $notes->map->id->toArray()
                        );
                    } else {
                        if (isset($arguments['confirmed']) && $arguments['confirmed']) {
                            $notes = Note::whereIn('id', $ids)
                                ->where('organization_id', $orgId)
                                ->where('pulse_id', $pulseId)
                                ->delete();
                            return 'Note deleted successfully.';
                        }

                        return "Confirm this action to user first";
                    }
                } catch (\Exception $e) {
                    return 'Error deleting notes, make sure to get the correct note first and ask for confirmation first then call the tool again.';
                }

            case 'getNoteDetails':
                $id = $arguments['id'] ?? null;

                if (empty($id)) {
                    return 'No note id provided. Please provide a valid note id and call this tool again.';
                }

                $validator = Validator::make(
                    ['id' => $id],
                    ['id' => 'required|uuid']
                );
                if ($validator->fails()) {
                    return 'Invalid note id format. Please provide a valid UUID and call this tool again.';
                }

                $note = Note::with('labels')
                    ->where('pulse_id', $pulseId)
                    ->where('organization_id', $orgId)
                    ->find($id);

                if (!$note) {
                    return 'Note not found. Please provide a valid note id and call this tool again.';
                }

                return 'retrieved note details successfully. Here are the details: ' .
                    json_encode($note);

            default:
                return parent::handleFunctionCall(
                    $functionName,
                    $arguments,
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );
        }
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last = $messages->last();
        $text = $last['content'] ?? '';

        return $this->processSystemThread(
            'notesAgent',
            $messages->last()['content'] ?? '',
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }
}
