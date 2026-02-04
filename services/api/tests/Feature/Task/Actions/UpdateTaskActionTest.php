<?php

namespace Tests\Feature\Task\Actions;

use App\Actions\Task\UpdateTaskAction;
use App\DataTransferObjects\Task\TaskData;
use App\Models\Assignee;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Tests\TestCase;

class UpdateTaskActionTest extends TestCase
{
    public function test_it_can_update_a_task_resource(): void
    {
        $task     = Task::first();
        $user     = User::inRandomOrder()->first();
        $category = Category::inRandomOrder()->first();

        $data = new TaskData(
            title: 'new title',
            description: 'new description',
            assignees: ['9e8f7330-973e-42a9-9919-f97210d6ebe5'],
            category_id: $category->id,
            organization_id: $task->organization_id,
            status: 'INPROGRESS',
            priority: 'URGENT',
            due_date: now(),
            type: 'TASK',
        );

        $action = app(UpdateTaskAction::class);

        $task = $action->handle(task: $task, data: $data);

        $this->assertInstanceOf(Task::class, $task);
        $this->assertEquals('new title', $task->title);
        $this->assertContainsOnlyInstancesOf(Assignee::class, $task->assignees);
        $this->assertEquals($category->id, $task->category_id);
        $this->assertEquals('new description', $task->description);
        $this->assertEquals('INPROGRESS', $task->status->value);
        $this->assertEquals('URGENT', $task->priority->value);
    }
}
