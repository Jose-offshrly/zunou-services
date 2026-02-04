<?php

namespace App\Services;

use App\Models\LiveUpload;
use Exception;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class LiveUploadService
{
    /**
     * Query the uploaded file data using OpenAI.
     *
     * @param string $fileId
     * @param string $prompt
     * @param string $orgId
     * @return string
     */
    public static function queryUploadedFileData(
        string $fileId,
        string $prompt,
        string $orgId,
    ): string {
        Log::info(
            "LiveUploadService: Querying uploaded file data for fileId: $fileId",
        );

        try {
            // Retrieve the LiveUpload record by fileId
            $liveUpload = LiveUpload::where('id', $fileId)
                ->where('organization_id', $orgId)
                ->firstOrFail();

            // Retrieve the full content of the uploaded file
            $fileContent = $liveUpload->full_content;

            if (empty($fileContent)) {
                throw new Exception(
                    "LiveUploadService: File content is empty for fileId: $fileId",
                );
            }

            // Prepare the prompt for OpenAI
            $openAIPrompt = "The user has uploaded a file with the following content:\n\n" .
                $fileContent .
                "\n\nQuery: $prompt";

            // Query OpenAI with the file content and the user's prompt
            $openAI   = \OpenAI::client(Config::get('zunou.openai.api_key'));
            $response = $openAI->chat()->create([
                'model'    => Config::get('zunou.openai.model'),
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'You are an AI assistant that helps users with queries about their uploaded files.',
                    ],
                    ['role' => 'user', 'content' => $openAIPrompt],
                ],
            ]);

            // Extract and return the response content
            $responseContent = $response['choices'][0]['message']['content'];

            return $responseContent;
        } catch (Exception $e) {
            Log::error(
                'LiveUploadService: Error querying uploaded file data - ' .
                    $e->getMessage(),
            );
            return 'An error occurred while processing your request.';
        }
    }
}
