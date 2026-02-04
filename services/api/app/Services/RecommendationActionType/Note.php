<?php

namespace App\Services\RecommendationActionType;

use App\Contracts\RecommendationActionTypeInterface;
use App\GraphQL\Mutations\CreateNoteMutation;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\LiveInsightRecommendationAction;
use App\Models\Note as NoteModel;
use App\Services\OpenAIService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Note implements RecommendationActionTypeInterface
{
    const CREATE_NOTE = 'create';
    const UPDATE_NOTE = 'update';
    const DELETE_NOTE = 'delete';

    public function execute(LiveInsightRecommendationAction $action, LiveInsightOutbox $insight): ?array
    {
        if ($action->method == 'create') {
            return $this->create($action, $insight);
        }

        if ($action->method == 'update') {
            return $this->update($action);
        }

        if ($action->method == 'delete') {
            return $this->delete($action);
        }

        return null;
    }

    protected function create(LiveInsightRecommendationAction $action, LiveInsightOutbox $insight): array
    {
        try {
            $noteCreator = new CreateNoteMutation();
            $newData = $action->data;
            $newData["organization_id"] = $insight->organization_id;
            $newData["pulse_id"] = $insight->pulse_id;
            $newData["user_id"] = $insight->user_id;
            $note = $noteCreator(null, $newData);

            return [
                'message' => 'Success, You can now view the newly created note in your pulse.',
                'id' => $note->id,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to create note', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while creating your note",
                'error' => true
            ];
        }
    }

    protected function update(LiveInsightRecommendationAction $action): array
    {
        try {
            $note = NoteModel::find($action->data['id']);
            if (!$note) {
                return ['message' => 'Failed to update note: Note not found'];
            }

            $updates = [];
            if (!empty($action->data['title'])) {
                $updates['title'] = $action->data['title'];
            }
            if (!empty($action->data['content'])) {
                $updates['content'] = $action->data['content'];
            }
            if (isset($action->data['pinned'])) {
                $updates['pinned'] = $action->data['pinned'];
            }

            if (!empty($updates)) {
                $note->update($updates);
            }

            $noteMutator = new CreateNoteMutation();
            if (!empty($action->data['labels_to_add'])) {
                $noteMutator->attachLabels($note, $action->data['labels_to_add']);
            }
            if (!empty($action->data['labels_to_remove'])) {
                $noteMutator->detachLabels($note, $action->data['labels_to_remove']);
            }
            if (isset($action->data['remove_all_labels']) && $action->data['remove_all_labels']) {
                $noteMutator->detachAllLabels($note);
            }

            return [
                'message' => 'Success, You can now view the updated note in your pulse.',
                'id' => $note->id,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to update note', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while updating your note",
                'error' => true
            ];
        }
    }

    protected function delete(LiveInsightRecommendationAction $action): array
    {
        try {
            $noteIds = $action->data;
            NoteModel::destroy($noteIds);
        
            return [
                'message' => 'Success, the note has been deleted in your pulse.',
                'id' => is_array($noteIds) ? $noteIds[0] : $noteIds,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to delete note', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while deleting your note",
                'error' => true
            ];
        }
    }

    public static function getClassifications(): array
    {
        return [
            self::CREATE_NOTE,
            self::UPDATE_NOTE,
            self::DELETE_NOTE,
            self::UNSUPPORTED_OPERATION,
        ];
    }

    public static function classifyOperation(array $recommendation): string
    {
        $recommendationString = json_encode($recommendation);
        $prompt = <<<EOD
        Refer to the recommendation below. Classify the operation if its the following
        create - for creating new note
        update - for updating existing note (title, content, labels, pinned status etc)
        delete - delete note
        unsupported_operation - the recommendation neither create, update, delete - it is note related but unsupported

        Heres the recommendation:
        {$recommendationString}
        EOD;

        $responseFmt = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'classification_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'classification' => [
                            'type' => 'string',
                            'enum' => [
                                self::CREATE_NOTE,
                                self::UPDATE_NOTE,
                                self::DELETE_NOTE,
                                self::UNSUPPORTED_OPERATION,
                            ],
                            'description' => "The classification of the recommendation either create, delete or update note",
                        ],
                    ],
                    'required'             => ['classification'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $request = [
            'model' => 'gpt-4.1',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $prompt
                ]
            ],
            'response_format' => $responseFmt
        ];

        $response = OpenAIService::createCompletion($request);
        $assistant = $response['choices'][0]['message'];
        $content = $assistant['content'] ?? '';

        $decoded = json_decode($content, true);
        return $decoded["classification"];
    }

    public static function getAllowedTools(string $classification): array
    {
        return match ($classification) {
            self::UPDATE_NOTE, self::DELETE_NOTE => ['queryNotes', 'searchNotes', 'getNoteDetails', 'searchLabels'],
            default => ['searchLabels'],
        };
    }

    public static function getOperationPrompt(string $classification, array $recommendation, LiveInsightOutbox $insight): string
    {
        $createPrompt = <<<EOD
            Create note for this recommendation:
                {$recommendation['title']}
                content: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}
                
            If labels are mentioned, use the available tool to find matching labels.
            If labels are mentioned but cannot be found, skip the labels part.
            
            Execute this recommendation without asking for confirmation.
            Return the note only in json format.
        EOD;

        $updatePrompt = <<<EOD
            Update note for this recommendation:
                {$recommendation['title']}
                {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}
            
            Use available tools to find the note to update.
            If labels need to be added/removed, use the search tool to find them.
            
            Execute this recommendation without asking for confirmation.
            Return the updated note data in json format.
        EOD;

        $deletePrompt = <<<EOD
            Delete note for this recommendation:
                {$recommendation['title']}
                {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}
            
            Use available tools to find the note to delete.
            Return the note id(s) to delete in json format.
        EOD;

        return match ($classification) {
            self::CREATE_NOTE => $createPrompt,
            self::UPDATE_NOTE => $updatePrompt,
            self::DELETE_NOTE => $deletePrompt,
            default => '',
        };
    }

    public static function getOperationSchema(string $classification): array
    {
        $createSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'create_note_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'title' => [
                            'type'        => 'string',
                            'description' => 'The title of the note.',
                        ],
                        'content' => [
                            'type'        => 'string',
                            'description' => 'The main content of the note.',
                        ],
                        'labels' => [
                            'type'        => 'array',
                            'description' => 'The labels or tags of the note.',
                            'items'       => [
                                'type' => 'string',
                            ],
                        ],
                        'pinned' => [
                            'type'        => 'boolean',
                            'description' => 'Whether the note is pinned. Default is false. Only true when user explicitly asks to pin the note.',
                        ],
                    ],
                    'required'             => ['title', 'content', 'labels', 'pinned'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $updateSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'update_note_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'id' => [
                            'type'        => 'string',
                            'description' => 'The id of the note.',
                        ],
                        'title' => [
                            'type'        => 'string',
                            'description' => 'The updated title of the note.',
                        ],
                        'content' => [
                            'type'        => 'string',
                            'description' => 'The updated note content with added updates. If the content uses HTML tags (e.g., <p>- item</p>), preserve the structure and add new updates using the same HTML tag pattern. Do not overwrite the original content unless the user explicitly asks to. Do not escape slashes or HTML tags — return raw HTML like <p>, not <\\/p> or &lt;p&gt;.',
                        ],
                        'labels_to_add' => [
                            'type'        => 'array',
                            'description' => 'The labels or tags to be added to the note.',
                            'items'       => [
                                'type' => 'string',
                            ],
                        ],
                        'labels_to_remove' => [
                            'type'        => 'array',
                            'description' => 'The labels or tags to be removed from the note.',
                            'items'       => [
                                'type' => 'string',
                            ],
                        ],
                        'remove_all_labels' => [
                            'type'        => 'boolean',
                            'description' => 'Set true if user explicitly asks to remove all labels from the note. Overrides labels_to_remove.',
                        ],
                        'pinned' => [
                            'type'        => 'boolean',
                            'description' => 'Whether the note is pinned or not.',
                        ],
                    ],
                    'required'             => ['id'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $deleteSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'delete_note_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'ids' => [
                            'type'        => 'array',
                            'description' => 'The ids of the notes.',
                            'items'       => [
                                'type' => 'string',
                            ],
                        ],
                    ],
                    'required'             => ['ids'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        return match ($classification) {
            self::CREATE_NOTE => $createSchema,
            self::UPDATE_NOTE => $updateSchema,
            self::DELETE_NOTE => $deleteSchema,
            default => [],
        };
    }

    public static function saveRecommendation(string $method, LiveInsightRecommendation $recommendation, LiveInsightOutbox $insight, array $data): void
    {
        if (isset($input["error"]) && $input["error"] === true) {
            self::saveFailedRecommendation(
                recommendationId: $recommendation->id,
                user_id: $insight->user_id,
                method: $method,
                errorMessage: "Sorry, something went wrong while carrying out your recommendation.."
            );
            return;
        }

        if ($method === self::UPDATE_NOTE) {
            $noteId = $data['id'] ?? null;
            if (!self::existAndValidUUID($noteId)) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::UPDATE_NOTE,
                    errorMessage: "Note not found. Try editing the note in your pulse instead."
                );
                return;
            }
        }

        if ($method === self::DELETE_NOTE) {
            $noteIds = $data['ids'] ?? [];

            if (! $noteIds) {
                 self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::DELETE_NOTE,
                    errorMessage: "Note not found. Try deleting the note in your pulse instead."
                );
                    
                return;
            }

            foreach ($noteIds as $noteId) {
                if (!self::existAndValidUUID($noteId)) {
                    self::saveFailedRecommendation(
                        recommendationId: $recommendation->id,
                        user_id: $insight->user_id,
                        method: self::DELETE_NOTE,
                        errorMessage: "Note not found. Try deleting the note in your pulse instead."
                    );

                    return;
                }
            }
        }

        $actionData = match ($method) {
            self::CREATE_NOTE => [
                'title' => $data['title'],
                'content' => $data['content'] ?? null,
                'labels' => $data['labels'] ?? [],
                'pinned' => $data['pinned'] ?? false,
            ],
            self::UPDATE_NOTE => [
                'id' => $data['id'],
                'title' => $data['title'] ?? null,
                'content' => $data['content'] ?? null,
                'pinned' => $data['pinned'] ?? null,
                'labels_to_add' => $data['labels_to_add'] ?? [],
                'labels_to_remove' => $data['labels_to_remove'] ?? [],
                'remove_all_labels' => $data['remove_all_labels'] ?? false,
            ],
            self::DELETE_NOTE => $data['ids'],
        };

        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendation->id,
            'method' => $method,
            'type' => 'note',
            'data' => $actionData,
            'user_id' => $insight->user_id,
        ]);
    }

    private static function saveFailedRecommendation(int $recommendationId, string $user_id, string $method, string $errorMessage, ?array $data = [])
    {
        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendationId,
            'method' => $method,
            'user_id' => $user_id,
            'type' => 'note',
            'data' => $data,
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    private static function existAndValidUUID($id): bool
    {
        $isValid = Str::isUuid($id);

        if (!$isValid) {
            return false;
        }

        return NoteModel::where('id', $id)->exists();
    }
}
