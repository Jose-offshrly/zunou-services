<?php

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightRecommendation;
use App\Models\LiveInsightRecommendationAction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UpdateRecommendationActionMutation
{
    public function __invoke($_, array $args): array
    {
        $userId = Auth::id();
        $input = $args['input'];

        // Find the action directly by ID
        $action = LiveInsightRecommendationAction::findOrFail(
            $input['recommendationActionsId']
        );

        // Validate that the action belongs to the current user
        if ($action->user_id !== $userId) {
            abort(403, 'Access denied. This action does not belong to you.');
        }

        // Validate that the action type matches the input type
        if ($action->type !== $input['type']) {
            return [
                'success' => false,
                'message' =>
                    'Action type mismatch. Expected: ' .
                    $action->type .
                    ', got: ' .
                    $input['type'],
            ];
        }

        // Get the recommendation for logging purposes
        // We've already validated ownership through the action's user_id
        $recommendation = $action->recommendation;

        if (!$recommendation) {
            abort(404, 'Recommendation not found.');
        }

        // Decode `changes` (string) into an array. Frontend sends a JSON string.
        $rawChanges = $input['changes'] ?? '';
        if (!is_string($rawChanges) || trim($rawChanges) === '') {
            return [
                'success' => false,
                'message' => 'Changes must be a non-empty JSON string.',
            ];
        }

        $decoded = json_decode($rawChanges, true);

        // Accept both objects (associative arrays) and arrays
        if (
            json_last_error() !== JSON_ERROR_NONE ||
            (!is_array($decoded) && !is_object($decoded))
        ) {
            return [
                'success' => false,
                'message' => 'Changes must be a valid JSON object or array.',
            ];
        }

        // Ensure we have an array (convert object to associative array if needed)
        $formData = is_array($decoded) ? $decoded : (array) $decoded;

        // Map the incoming form-style payload (getInitialFormData) into the
        // internal action data format, keeping unrelated fields intact.
        $existingData = $action->data ?? [];
        $mappedData = $this->mapFormDataToActionData(
            $input['type'],
            $formData,
            $existingData
        );

        $action->data = $mappedData;
        $action->save();

        Log::info('Updated recommendation action', [
            'action_id' => $action->id,
            'recommendation_id' => $recommendation->id,
            'type' => $input['type'],
            'user_id' => $userId,
        ]);

        return [
            'success' => true,
            'message' => 'Recommendation action updated successfully.',
        ];
    }

    /**
     * Map frontend form payload (following getInitialFormData structure)
     * into the internal action `data` shape used by executors.
     *
     * The goal is:
     * - keep existing unrelated keys intact
     * - only update the fields that are editable from the UI
     */
    private function mapFormDataToActionData(
        string $type,
        array $formData,
        ?array $existingData = []
    ): array {
        $existingData = $existingData ?? [];

        switch ($type) {
            case 'task':
                return $this->mapTaskFormToData($formData, $existingData);

            case 'note':
                return $this->mapNoteFormToData($formData, $existingData);

            case 'team_chat':
                return $this->mapTeamChatFormToData($formData, $existingData);

            case 'meeting':
                return $this->mapMeetingFormToData($formData, $existingData);

            default:
                // Fallback – behave like the old implementation.
                return array_merge($existingData, $formData);
        }
    }

    private function mapTaskFormToData(
        array $formData,
        array $existingData
    ): array {
        $data = $existingData;

        if (array_key_exists('task_title', $formData)) {
            $data['title'] = $formData['task_title'];
        }

        if (array_key_exists('task_description', $formData)) {
            $data['description'] = $formData['task_description'];
        }

        if (array_key_exists('task_status', $formData)) {
            $data['status'] = $formData['task_status'];
        }

        if (array_key_exists('task_priority', $formData)) {
            $data['priority'] = $formData['task_priority'];
        }

        if (array_key_exists('task_dueDate', $formData)) {
            // We store it as a raw string here; the Task executor is already
            // responsible for turning this into a Carbon instance when needed.
            $data['due_date'] = $formData['task_dueDate'];
        }

        if (array_key_exists('task_assignees', $formData)) {
            // Frontend sends assignees in the same structure as the original
            // recommendation data (array of { id, name } objects).
            $data['assignees'] = $formData['task_assignees'];
        }

        return $data;
    }

    private function mapNoteFormToData(
        array $formData,
        array $existingData
    ): array {
        $data = $existingData;

        if (array_key_exists('note_title', $formData)) {
            $data['title'] = $formData['note_title'];
        }

        if (array_key_exists('note_description', $formData)) {
            // Backend uses `content` for notes.
            $data['content'] = $formData['note_description'];
        }

        if (array_key_exists('note_pinned', $formData)) {
            $data['pinned'] = (bool) $formData['note_pinned'];
        }

        if (array_key_exists('note_labels', $formData)) {
            $data['labels'] = $formData['note_labels'];
        }

        return $data;
    }

    private function mapTeamChatFormToData(
        array $formData,
        array $existingData
    ): array {
        $data = $existingData;

        if (array_key_exists('teamchat_message', $formData)) {
            $raw = $formData['teamchat_message'];

            // `teamchat_message` comes from a rich-text editor (Slate format).
            // Format: [{"type": "paragraph", "children": [{"text": "share and promote"}]}]
            // Save the entire Slate format JSON as-is in the content field.
            if (is_string($raw)) {
                // Already a JSON string, use it directly
                $data['content'] = $raw;
            } elseif (is_array($raw)) {
                // If it's an array, encode it to JSON string
                $data['content'] = json_encode($raw);
            } else {
                // Fallback: convert to string
                $data['content'] = (string) $raw;
            }
        }

        return $data;
    }

    private function mapMeetingFormToData(
        array $formData,
        array $existingData
    ): array {
        // Start with existing data to preserve all fields
        $data = $existingData;

        // For create:summary, use flat structure - directly update fields
        if (array_key_exists('meeting_summary', $formData)) {
            $data['summary'] = $formData['meeting_summary'];
        }

        if (array_key_exists('meeting_action_items', $formData)) {
            $actionItems = $formData['meeting_action_items'];
            // action_items should be JSON string
            if (is_array($actionItems)) {
                $data['action_items'] = json_encode($actionItems);
            } else {
                $data['action_items'] = $actionItems;
            }
        }

        if (array_key_exists('meeting_potential_strategies', $formData)) {
            $strategies = $formData['meeting_potential_strategies'];
            // potential_strategies should be JSON string
            if (is_array($strategies)) {
                $data['potential_strategies'] = json_encode($strategies);
            } else {
                $data['potential_strategies'] = $strategies;
            }
        }

        return $data;
    }
}
