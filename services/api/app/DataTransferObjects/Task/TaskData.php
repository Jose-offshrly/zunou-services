<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Task;

use App\Support\Data;
use Illuminate\Support\Carbon;

final class TaskData extends Data
{
    public function __construct(
        public readonly string $title,
        public readonly string $organization_id,
        public readonly string $type,
        /** @var string[] $assignees */
        public readonly ?array $assignees = null,
        public readonly ?string $category_id = null,
        public readonly ?string $status = null,
        public readonly ?string $priority = null,
        public readonly ?Carbon $due_date = null,
        public readonly ?Carbon $start_date = null,
        public readonly ?string $task_phase_id = null,
        public readonly ?string $task_status_id = null,
        public readonly ?string $progress = null,
        public readonly ?string $color = null,
        public readonly ?string $description = null,
        public readonly ?string $parent_id = null,
        public readonly ?SourceData $source = null,
        /** @var string[] $dependency_task_ids */
        public readonly ?array $dependency_task_ids = null
    ) {
    }
}
