<?php

namespace App\Services\Agents\Helpers;

use App\Models\GettingStarted;
use App\Services\VectorDBService;
use Illuminate\Support\Facades\Log;

class GettingStartedHelper
{
    protected $vectorDBService;

    public function __construct()
    {
        $this->vectorDBService = new VectorDBService();
    }

    public function getNextQuestionText($orgId, $pulseId)
    {
        $question = $this->getNextUnansweredQuestion($orgId, $pulseId);

        return "Here is the next 'Getting Started' question:\n\n" .
            "Question: {$question['question']}\n\n" .
            "Question ID: {$question['question_id']}\n\n" .
            'Please confirm if this information is accurate, or let us know if you’d like to update it. ';
    }

    /**
     * Fetch the next unanswered question from the Getting Started table.
     */
    public function getNextUnansweredQuestion($orgId, $pulseId)
    {
        $question = GettingStarted::where('organization_id', $orgId)
            ->where('pulse_id', $pulseId)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->first();

        if ($question) {
            // Return the question with 'id' renamed to 'question_id' so it is easier for the llm to match
            return [
                'question_id' => $question->id,
                'question'    => $question->question,
                'status'      => $question->status,
                'created_at'  => $question->created_at,
                'updated_at'  => $question->updated_at,
            ];
        }

        return null; // Return null if no unanswered question is found
    }

    /**
     * Marks a Getting Started question as complete based on the GettingStarted ID.
     *
     * @param string $orgId
     * @param string $pulseId
     * @param int $id
     * @return void
     */

    public function markQuestionAsComplete(
        string $orgId,
        string $pulseId,
        int $id,
    ): void {
        // Find the question associated with the specified organization Id, Pulse Id and question ID
        $question = GettingStarted::where('organization_id', $orgId)
            ->where('pulse_id', $pulseId)
            ->where('id', $id)
            ->first();

        if ($question) {
            $question->status = 'complete'; // Update the status to complete
            $question->save(); // Save the change
            Log::info("Marked question with ID {$id} as complete.");
        } else {
            Log::warning(
                "No question found with ID {$id} to mark as complete.",
            );
        }
    }
}
