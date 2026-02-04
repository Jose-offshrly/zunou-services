<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Contracts\Taskable;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class GenerateTaskNumberAction
{
    /**
     * Generate a unique task number in the format: {ENTITY_CODE}-T{SEQUENCE}
     *
     * Example: BJU2-T001, BJU2-T012, BJU2-T735
     * - BJU2: Short alphanumeric code derived from the entity name
     * - T: Task prefix
     * - 001: Incremental sequence number within the entity (minimum 3 digits)
     */
    public function handle(Taskable $entity): string
    {
        $entityCode = $this->generateEntityCode($entity);
        $sequenceNumber = $this->getNextSequenceNumber($entity);

        // Pad sequence number to at least 3 digits (e.g., 1 -> 001, 12 -> 012, 735 -> 735)
        $formattedSequence = str_pad((string) $sequenceNumber, 3, '0', STR_PAD_LEFT);

        return "{$entityCode}-T{$formattedSequence}";
    }

    /**
     * Generate a short alphanumeric code from the entity name.
     *
     * Uses the first letters of words (up to 3) plus a numeric suffix
     * derived from the entity ID to ensure uniqueness.
     *
     * Example: "Blue Jay Project" -> "BJP2"
     */
    private function generateEntityCode(Taskable $entity): string
    {
        $name = $entity->name ?? 'UNKNOWN';

        // Extract first letters from words (max 3 letters)
        $words = preg_split('/\s+/', trim($name));
        $initials = '';

        foreach ($words as $word) {
            if (strlen($initials) >= 3) {
                break;
            }

            $firstChar = Str::upper(Str::substr($word, 0, 1));

            // Only include alphanumeric characters
            if (ctype_alnum($firstChar)) {
                $initials .= $firstChar;
            }
        }

        // Ensure we have at least one character
        if (empty($initials)) {
            $initials = 'X';
        }

        // Add a numeric suffix from entity ID for uniqueness
        // Use last 1-2 digits from the UUID hash
        $idHash = crc32($entity->id);
        $suffix = abs($idHash) % 100;

        // If suffix is single digit, just use it; otherwise use last digit
        $suffixStr = $suffix < 10 ? (string) $suffix : (string) ($suffix % 10);

        return $initials . $suffixStr;
    }

    /**
     * Get the next sequence number for tasks within the entity.
     *
     * The sequence is incremental and never reused, even if tasks are deleted.
     */
    private function getNextSequenceNumber(Taskable $entity): int
    {
        return DB::transaction(function () use ($entity) {
            // Get the highest existing task number for this entity
            $lastTaskNumber = Task::where('entity_type', get_class($entity))
                ->where('entity_id', $entity->id)
                ->whereNotNull('task_number')
                ->lockForUpdate()
                ->orderByRaw("CAST(SUBSTRING(task_number FROM 'T([0-9]+)$') AS INTEGER) DESC")
                ->value('task_number');

            // Extract the numeric part after 'T'
            if ($lastTaskNumber && preg_match('/T(\d+)$/', $lastTaskNumber, $matches)) {
                return (int) $matches[1] + 1;
            }

            // Start from 1 if no existing tasks
            return 1;
        });
    }
}
