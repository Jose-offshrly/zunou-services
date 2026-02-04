<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Events\DirectMessageUpdated;
use App\Models\DirectMessage;
use App\Models\DirectMessageThread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UpdateDirectMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $directMessage = DirectMessage::findOrFail(
                $args['input']['directMessageId'],
            );

            $directMessage->content   = $args['input']['content'];
            $directMessage->is_edited = true;
            $directMessage->save();

            // Handle file attachments if provided
            $files = $args['input']['files'] ?? null;
            if ($files === null) {
                $directMessage->files()->delete();
            } elseif (is_array($files)) {
                if (empty($files)) {
                    $directMessage->files()->delete();
                } else {
                    $this->syncFileAttachments($directMessage, $files);
                }
            }

            // Dispatch event for real-time update
            DirectMessageUpdated::dispatch($directMessage);

            return $directMessage->refresh();
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update direct message' . $e->getMessage(),
            );
        }
    }

    /**
     * Sync file attachments for the direct message:
     * - If a file path already exists for this DirectMessage, keep it (no duplicate create)
     * - If an existing file is not present in the new list, delete it
     * - Create records for new file paths
     */
    private function syncFileAttachments(
        DirectMessage $directMessage,
        array $files
    ): void {
        $thread = DirectMessageThread::find(
            $directMessage->direct_message_thread_id
        );

        $existingFiles = $directMessage->files()->get();
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
            $directMessage
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
                // Already exists for this DirectMessage -> skip creating duplicate
                continue;
            }

            $directMessage->files()->create([
                'path' => $fileData['fileKey'],
                'file_name' => $fileData['fileName'] ?? null,
                'type' => $fileData['type'] ?? null,
                'organization_id' => $thread?->organization_id,
            ]);
        }
    }
}
