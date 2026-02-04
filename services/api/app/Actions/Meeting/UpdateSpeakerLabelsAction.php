<?php

declare(strict_types=1);

namespace App\Actions\Meeting;

use App\Models\Transcript;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class UpdateSpeakerLabelsAction
{
    public function handle(?string $botMeetingId, array $maps, ?string $transcriptId = null): bool
    {
        // Validate required parameters
        if (empty($botMeetingId)) {
            throw new Error('bot_meeting_id is required');
        }

        if (empty($maps) || ! is_array($maps)) {
            throw new Error('maps is required and must be an array');
        }

        // Convert maps from array format to object format
        // Input: [{user_name: "Eson Manuzon", speaker: "A"}, ...]
        // Output: {"A": "Eson Manuzon", ...}
        $speakerMapping = [];
        foreach ($maps as $map) {
            if (! isset($map['speaker']) || ! isset($map['user_name'])) {
                Log::warning('Invalid map entry skipped', ['map' => $map]);

                continue;
            }

            $speaker  = trim($map['speaker']);
            $userName = trim($map['user_name']);

            if (! empty($speaker) && ! empty($userName)) {
                $speakerMapping[$speaker] = $userName;
            }
        }

        if (empty($speakerMapping)) {
            throw new Error('No valid speaker mappings found');
        }

        // Prepare the payload
        $payload = [
            'meeting_id'      => $botMeetingId,
            'speaker_mapping' => $speakerMapping,
        ];

        Log::info('Calling update-speaker-labels endpoint', [
            'url'     => config('zunou.companion.update_speaker_label_url'),
            'payload' => $payload,
        ]);

        // Make the HTTP request
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(config('zunou.companion.update_speaker_label_url'), $payload);

        if (! $response->successful()) {
            Log::error('Failed to update speaker labels', [
                'status'   => $response->status(),
                'response' => $response->body(),
            ]);

            throw new Error('Failed to update speaker labels: '.$response->body());
        }

        $responseData = $response->json();

        Log::info('Successfully updated speaker labels', [
            'response' => $responseData,
        ]);

        // Update transcript content if transcriptId is provided and transcription exists in response
        if (! empty($transcriptId)) {
            // Handle different response structures
            $transcription = null;
            if (isset($responseData['response']['transcription'])) {
                // Nested response structure: {"response": {"transcription": "..."}}
                $transcription = $responseData['response']['transcription'];
            } elseif (isset($responseData['transcription'])) {
                // Direct response structure: {"transcription": "..."}
                $transcription = $responseData['transcription'];
            }

            if (! empty($transcription)) {
                $transcript = Transcript::find($transcriptId);

                if ($transcript) {
                    $existingContent = $transcript->content;
                    $marker = '### Transcript:';

                    // Find the position of the marker
                    $markerPosition = strpos($existingContent, $marker);

                    if ($markerPosition !== false) {
                        // Keep everything before and including the marker, then append new transcription
                        $contentBeforeMarker = substr($existingContent, 0, $markerPosition + strlen($marker));
                        $updatedContent = $contentBeforeMarker . "\n\n" . $transcription;
                    } else {
                        // If marker doesn't exist, append it with the new transcription
                        $updatedContent = $existingContent . "\n\n" . $marker . "\n\n" . $transcription;
                    }

                    // Update speakers->maps with the new speakerMapping
                    $existingSpeakers = $transcript->speakers ?? [];
                    if (! is_array($existingSpeakers)) {
                        $existingSpeakers = [];
                    }
                    if (! isset($existingSpeakers['speakers'])) {
                        $existingSpeakers['speakers'] = [];
                    }
                    $existingSpeakers['maps'] = $speakerMapping;

                    $transcript->update([
                        'content'  => $updatedContent,
                        'speakers' => $existingSpeakers,
                    ]);

                    Log::info('Successfully updated transcript content after marker', [
                        'transcript_id' => $transcriptId,
                    ]);
                } else {
                    Log::warning('Transcript not found for update', [
                        'transcript_id' => $transcriptId,
                    ]);
                }
            } else {
                Log::warning('Transcription not found in response', [
                    'transcript_id' => $transcriptId,
                    'response'      => $responseData,
                ]);
            }
        }

        return true;
    }
}

