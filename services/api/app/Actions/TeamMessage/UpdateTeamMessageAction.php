<?php

namespace App\Actions\TeamMessage;

use App\DataTransferObjects\TeamMessageData;
use App\Events\TeamMessageUpdated;
use App\Models\File;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Support\Facades\Log;

class UpdateTeamMessageAction
{
    public function handle(
        string $teamMessageId,
        TeamMessageData $data
    ): TeamMessage {
        $teamMessage = TeamMessage::findOrFail($teamMessageId);

        $teamMessage->content = $data->content;
        $teamMessage->is_edited = true;
        $teamMessage->updated_at = now();
        $teamMessage->save();

        // Handle file attachments if provided
        if ($data->files === null) {
            $teamMessage->files()->delete();
        } elseif (is_array($data->files)) {
            if (empty($data->files)) {
                $teamMessage->files()->delete();
            } else {
                $this->syncFileAttachments($teamMessage, $data->files);
            }
        }

        // Dispatch event for real-time update
        TeamMessageUpdated::dispatch($teamMessage);

        Log::info('Team message updated', [
            'team_message_id' => $teamMessageId,
            'content' => $data->content,
        ]);

        return $teamMessage->refresh();
    }

    /**
     * Sync file attachments for the team message:
     * - If a file path already exists for this TeamMessage, keep it (no duplicate create)
     * - If an existing file is not present in the new list, delete it
     * - Create records for new file paths
     */
    private function syncFileAttachments(
        TeamMessage $teamMessage,
        array $files
    ): void {
        $teamThread = TeamThread::with('pulse')->find(
            $teamMessage->team_thread_id
        );

        $existingFiles = $teamMessage->files()->get();
        $existingPathsIndex = $existingFiles->pluck('id', 'path'); // path => id

        $incomingPaths = collect($files)->pluck('fileKey')->filter()->values();

        // Delete files that are no longer present
        $pathsToKeep = $incomingPaths->toArray();
        $pathsToDelete = $existingFiles->filter(function ($file) use (
            $pathsToKeep
        ) {
            return !in_array($file->path, $pathsToKeep, true);
        });

        if ($pathsToDelete->isNotEmpty()) {
            $teamMessage
                ->files()
                ->whereIn('id', $pathsToDelete->pluck('id'))
                ->delete();
        }

        // Create new files that don't already exist by path
        foreach ($files as $fileData) {
            $path = $fileData['fileKey'] ?? null;
            if (!$path) {
                continue;
            }

            if ($existingPathsIndex->has($path)) {
                // Already exists for this TeamMessage -> skip creating duplicate
                continue;
            }

            File::create([
                'path' => $fileData['fileKey'],
                'file_name' => $fileData['fileName'] ?? null,
                'type' => $fileData['type'] ?? null,
                'entity_id' => $teamMessage->id,
                'entity_type' => TeamMessage::class,
                'pulse_id' => $teamThread?->pulse_id,
                'organization_id' => $teamThread?->pulse?->organization_id,
            ]);
        }
    }
}
