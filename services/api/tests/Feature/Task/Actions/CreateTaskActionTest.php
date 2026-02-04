<?php

namespace Tests\Feature\Task\Actions;

use App\Actions\Task\CreateTaskAction;
use App\Contracts\Taskable;
use App\DataTransferObjects\Task\SourceData;
use App\DataTransferObjects\Task\TaskData;
use App\Enums\TaskSource;
use App\Models\Assignee;
use App\Models\Category;
use App\Models\Meeting;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CreateTaskActionTest extends TestCase
{
    public function test_it_can_create_a_task_resource(): void
    {
        $user     = User::first();
        $category = Category::factory()->create();
        /** @var Taskable $pulse */
        $pulse = Pulse::factory()->create();
        $org   = Organization::first();

        $data = new TaskData(
            title: 'task 1',
            description: 'task description',
            assignees: [$user->id],
            category_id: $category->id,
            organization_id: $org->id,
            status: 'TODO', // open|in-progress|completed|blocked
            priority: 'MEDIUM', // high|medium|low
            due_date: Carbon::parse('April 1, 2025 00:00:00'),
            type: 'TASK',
        );

        $action = app(CreateTaskAction::class);

        $task = $action->handle($pulse, $data);

        $this->assertInstanceOf(Task::class, $task);
        $this->assertEquals('task 1', $task->title);
        $this->assertEquals('task description', $task->description);
        $this->assertContainsOnlyInstancesOf(Assignee::class, $task->assignees);
        $this->assertInstanceOf(Category::class, $task->category);
        $this->assertInstanceOf(Organization::class, $task->organization);
        $this->assertInstanceOf(Pulse::class, $task->entity);
        $this->assertEquals('TODO', $task->status->value);
        $this->assertEquals('MEDIUM', $task->priority->value);
        $this->assertInstanceOf(Carbon::class, $task->due_date);
    }

    public function test_it_can_create_a_task_resource_with_source(): void
    {
        $user = User::first();
        $this->actingAs($user);
        $category = Category::factory()->create();
        /** @var Taskable $pulse */
        $pulse   = Pulse::factory()->create();
        $org     = Organization::first();
        $meeting = Meeting::first();

        $data = new TaskData(
            title: 'task 1',
            description: 'task description',
            assignees: [$user->id],
            category_id: $category->id,
            organization_id: $org->id,
            status: 'TODO', // open|in-progress|completed|blocked
            priority: 'MEDIUM', // high|medium|low
            due_date: Carbon::parse('April 1, 2025 00:00:00'),
            type: 'TASK',
            source: new SourceData(
                type: TaskSource::MEETING->value,
                id: $meeting->id,
            ),
        );

        $action = app(CreateTaskAction::class);

        $task = $action->handle($pulse, $data);

        $this->assertInstanceOf(Task::class, $task);
        $this->assertEquals('task 1', $task->title);
        $this->assertEquals('task description', $task->description);
        $this->assertContainsOnlyInstancesOf(Assignee::class, $task->assignees);
        $this->assertInstanceOf(Category::class, $task->category);
        $this->assertInstanceOf(Organization::class, $task->organization);
        $this->assertInstanceOf(Pulse::class, $task->entity);
        $this->assertEquals('TODO', $task->status->value);
        $this->assertEquals('MEDIUM', $task->priority->value);
        $this->assertInstanceOf(Carbon::class, $task->due_date);
    }

    public function test_it_can_create_a_sub_task_resource(): void
    {
        $user     = User::first();
        $category = Category::factory()->create();
        /** @var Taskable $pulse */
        $pulse = Pulse::factory()->create();
        $org   = Organization::first();
        $task  = Task::first();

        $data = new TaskData(
            title: 'task 1',
            description: 'task description',
            assignees: [$user->id],
            category_id: $category->id,
            organization_id: $org->id,
            status: 'TODO', // open|in-progress|completed|blocked
            priority: 'NORMAL', // high|medium|low
            due_date: 'April 1, 2025 00:00:00',
            parent_id: $task->id,
            type: 'TASK',
        );

        $action = app(CreateTaskAction::class);

        $task = $action->handle($pulse, $data);

        $this->assertInstanceOf(Task::class, $task);
        $this->assertNotNull($task->parent_id);
    }

    public function test_it_can_create_a_task_list_type_resource(): void
    {
        /** @var Taskable $pulse */
        $pulse = Pulse::factory()->create();
        $org   = Organization::first();

        $data = new TaskData(
            title: 'task 1',
            description: 'task description',
            organization_id: $org->id,
            type: 'LIST',
        );

        $action = app(CreateTaskAction::class);

        $task = $action->handle($pulse, $data);

        $this->assertInstanceOf(Task::class, $task);
        $this->assertEquals('task 1', $task->title);
        $this->assertEquals('task description', $task->description);
        $this->assertEquals('LIST', $task->type->value);
        $this->assertInstanceOf(Organization::class, $task->organization);
        $this->assertInstanceOf(Pulse::class, $task->entity);
    }
}
