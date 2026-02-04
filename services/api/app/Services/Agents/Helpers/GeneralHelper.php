<?php

namespace App\Services\Agents\Helpers;

use App\Jobs\ProcessTranslationJob;
use App\Models\DataSource;
use App\Models\UserSuggestion;
use App\Services\VectorDBService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GeneralHelper
{
    protected $vectorDBService;

    public function __construct()
    {
        $this->vectorDBService = new VectorDBService();
    }

    public function suggestNewInformation($data, $orgId, $pulseId, $userId)
    {
        try {
            // Validate and sanitize the input
            if (empty($data)) {
                Log::warning(
                    '[GeneralHelper::suggestNewInformation] Empty data provided',
                );
                return 'No data provided for suggestion';
            }

            // Create a new UserSuggestion entry
            $userSuggestion = UserSuggestion::create([
                'id'              => (string) \Illuminate\Support\Str::uuid(),
                'pulse_id'        => $pulseId,
                'organization_id' => $orgId,
                'user_id'         => $userId,
                'suggestion'      => $data,
            ]);

            Log::info(
                '[GeneralHelper::suggestNewInformation] UserSuggestion created successfully',
                [
                    'id'              => $userSuggestion->id,
                    'pulse_id'        => $pulseId,
                    'organization_id' => $orgId,
                    'user_id'         => $userId,
                ],
            );

            return 'New information item suggested successfully';
        } catch (\Exception $e) {
            Log::error(
                '[GeneralHelper::suggestNewInformation] Error creating UserSuggestion',
                [
                    'message' => $e->getMessage(),
                    'trace'   => $e->getTraceAsString(),
                ],
            );

            return 'Failed to suggest new information';
        }
    }

    public function translateVideo(
        $targetLanguage,
        $data_source_id,
        $orgId,
        $pulseId,
        $threadId,
        $userId,
    ) {
        Log::info(
            "[GeneralHelper] translate $data_source_id video to $targetLanguage",
        );

        // Fetch the data source record
        $dataSource = DataSource::findOrFail($data_source_id);
        // Check if metadata is already an array
        $metadata = is_array($dataSource->metadata)
            ? $dataSource->metadata
            : json_decode($dataSource->metadata, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Failed to decode JSON metadata', [
                'error' => json_last_error_msg(),
            ]);
            return 'Sorry, we were unable to process the video - there was an error decoding the metadata.';
        }
        $source_file = $metadata['fileKey'] ?? null;

        // Generate the new fileKey with the language suffix
        $pathInfo   = pathinfo($source_file); // Extract path parts
        $newFileKey = $pathInfo['dirname'] .
            '/' .
            $pathInfo['filename'] .
            "_$targetLanguage." .
            $pathInfo['extension'];

        // Generate a suitable description using AI
        $description = $this->generateDescription(
            $dataSource->name,
            $dataSource->description,
            $targetLanguage,
        );

        // Create the new DataSource record - without triggering the observer
        $destinationDataSource = Model::withoutEvents(function () use (
            $dataSource,
            $newFileKey,
            $orgId,
            $pulseId,
            $targetLanguage,
            $description
        ) {
            return DataSource::create([
                'id'              => (string) Str::uuid(),
                'organization_id' => $orgId,
                'type'            => 'mp4',
                'name'            => $dataSource->name . "_$targetLanguage",
                'pulse_id'        => $pulseId,
                'metadata'        => ['fileKey' => $newFileKey],

                'status'      => 'INDEXING',
                'description' => $description, // Add the AI-generated description
            ]);
        });

        ProcessTranslationJob::dispatch(
            $dataSource->id,
            $destinationDataSource->id,
            $targetLanguage,
            $userId,
            $threadId,
        )->onQueue('default');

        return 'We are processing the file in the background. You will be notified when the translation is complete.  The results will be available at this datasource ID: ' .
            $destinationDataSource->id .
            '.  Please dont show this ID to the user yet.';
    }

    protected function generateDescription(
        $originalName,
        $originalDescription,
        $targetLanguage,
    ) {
        try {
            $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
            $model    = AgentConfig::toolModel('general', 'translateVideo');
            $response = $openAI->chat()->create([
                'model'    => $model,
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'You are an assistant that helps update video descriptions. Given the original name and description of a video, create a new description that includes the fact that the video is translated into a specified language. Keep the response concise and clear. No embellishments, keep it professional. Take the original description and just mention that it is in  the new language. Just return the description text, dont start with "New Description:" etc',
                    ],
                    [
                        'role'    => 'user',
                        'content' => "Original Name: $originalName\nOriginal Description: $originalDescription\nTarget Language: $targetLanguage",
                    ],
                ],
            ]);

            // Extract the description from the response
            $description = $response['choices'][0]['message']['content'] ?? "Translated video in $targetLanguage";

            return trim($description);
        } catch (\Exception $e) {
            Log::error(
                'Failed to generate AI description: ' . $e->getMessage(),
            );

            // Fallback description
            return "Translated video in $targetLanguage";
        }
    }
}
