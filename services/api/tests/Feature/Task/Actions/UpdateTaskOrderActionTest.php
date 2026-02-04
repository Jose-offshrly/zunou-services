<?php

declare(strict_types=1);

namespace Tests\Feature\Task\Actions;

use App\Actions\Task\UpdateTaskOrderAction;
use App\Models\Task;
use Tests\TestCase;

class UpdateTaskOrderActionTest extends TestCase
{
    public function test_it_can_sort_tasks(): void
    {
        $updates = [
            [
                'taskId'   => 'ce804f80-bd41-42be-aacd-855d955d2ae1',
                'order'    => 3,
                'parentId' => null,
            ],
            [
                'taskId'   => 'ce804f80-bd41-42be-aacd-855d955d2ae0',
                'order'    => 2,
                'parentId' => null,
            ],
            [
                'taskId'   => '99304986-666c-4e25-98b8-f29d6fd05e90',
                'order'    => 1,
                'parentId' => null,
            ],
        ];

        $action = app(UpdateTaskOrderAction::class);

        $tasks = $action->handle($updates);

        $this->assertContainsOnlyInstancesOf(Task::class, $tasks);
    }
}
