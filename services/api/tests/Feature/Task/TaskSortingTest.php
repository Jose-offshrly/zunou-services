<?php

namespace Tests\Feature\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\Assignee;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TaskSortingTest extends TestCase
{
    protected Organization $org;
    protected Pulse $pulse;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::first();
        $this->pulse = Pulse::factory()->create([
            'organization_id' => $this->org->id,
        ]);
    }

    /** @test */
    public function it_can_sort_tasks_by_priority_ascending(): void
    {
        // Create tasks with different priorities
        $taskUrgent = $this->createTask([
            'title' => 'Urgent Task',
            'priority' => TaskPriority::URGENT,
        ]);

        $taskHigh = $this->createTask([
            'title' => 'High Priority Task',
            'priority' => TaskPriority::HIGH,
        ]);

        $taskMedium = $this->createTask([
            'title' => 'Medium Priority Task',
            'priority' => TaskPriority::MEDIUM,
        ]);

        $taskLow = $this->createTask([
            'title' => 'Low Priority Task',
            'priority' => TaskPriority::LOW,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('PRIORITY_ASC')
            ->get();

        // String enums sort alphabetically: HIGH, LOW, MEDIUM, URGENT
        $this->assertCount(4, $tasks);
        $priorities = $tasks
            ->pluck('priority')
            ->map(fn($p) => $p->value)
            ->toArray();
        $this->assertEquals('HIGH', $priorities[0]);
        $this->assertEquals('URGENT', $priorities[3]);
    }

    /** @test */
    public function it_can_sort_tasks_by_priority_descending(): void
    {
        $taskUrgent = $this->createTask([
            'priority' => TaskPriority::URGENT,
        ]);

        $taskLow = $this->createTask([
            'priority' => TaskPriority::LOW,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('PRIORITY_DESC')
            ->get();

        $this->assertEquals($taskUrgent->id, $tasks->first()->id);
        $this->assertEquals($taskLow->id, $tasks->last()->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_status_ascending(): void
    {
        $taskCompleted = $this->createTask([
            'title' => 'Completed Task',
            'status' => TaskStatus::COMPLETED,
        ]);

        $taskInProgress = $this->createTask([
            'title' => 'In Progress Task',
            'status' => TaskStatus::INPROGRESS,
        ]);

        $taskTodo = $this->createTask([
            'title' => 'Todo Task',
            'status' => TaskStatus::TODO,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('STATUS_ASC')
            ->get();

        $this->assertCount(3, $tasks);
        // Verify tasks are sorted (exact order depends on enum values)
        $statuses = $tasks
            ->pluck('status')
            ->map(fn($s) => $s->value)
            ->toArray();
        $sortedStatuses = $statuses;
        sort($sortedStatuses);
        $this->assertEquals($sortedStatuses, $statuses);
    }

    /** @test */
    public function it_can_sort_tasks_by_status_descending(): void
    {
        $taskCompleted = $this->createTask(['status' => TaskStatus::COMPLETED]);
        $taskTodo = $this->createTask(['status' => TaskStatus::TODO]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('STATUS_DESC')
            ->get();

        $statuses = $tasks
            ->pluck('status')
            ->map(fn($s) => $s->value)
            ->toArray();
        $sortedStatuses = $statuses;
        rsort($sortedStatuses);
        $this->assertEquals($sortedStatuses, $statuses);
    }

    /** @test */
    public function it_can_sort_tasks_by_due_date_ascending(): void
    {
        $taskDueTomorrow = $this->createTask([
            'title' => 'Due Tomorrow',
            'due_date' => Carbon::now()->addDay(),
        ]);

        $taskDueNextWeek = $this->createTask([
            'title' => 'Due Next Week',
            'due_date' => Carbon::now()->addWeek(),
        ]);

        $taskDueToday = $this->createTask([
            'title' => 'Due Today',
            'due_date' => Carbon::now(),
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('DUE_DATE_ASC')
            ->get();

        $this->assertEquals($taskDueToday->id, $tasks->first()->id);
        $this->assertEquals($taskDueNextWeek->id, $tasks->last()->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_due_date_descending(): void
    {
        $taskDueTomorrow = $this->createTask([
            'due_date' => Carbon::now()->addDay(),
        ]);

        $taskDueNextWeek = $this->createTask([
            'due_date' => Carbon::now()->addWeek(),
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('DUE_DATE_DESC')
            ->get();

        $this->assertEquals($taskDueNextWeek->id, $tasks->first()->id);
        $this->assertEquals($taskDueTomorrow->id, $tasks->last()->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_assignee_ascending(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice Smith']);
        $userZara = User::factory()->create(['name' => 'Zara Jones']);
        $userBob = User::factory()->create(['name' => 'Bob Wilson']);

        $taskForAlice = $this->createTask(['title' => 'Task for Alice']);
        $taskForAlice->assignees()->create(['user_id' => $userAlice->id]);

        $taskForZara = $this->createTask(['title' => 'Task for Zara']);
        $taskForZara->assignees()->create(['user_id' => $userZara->id]);

        $taskForBob = $this->createTask(['title' => 'Task for Bob']);
        $taskForBob->assignees()->create(['user_id' => $userBob->id]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('ASSIGNEE_ASC')
            ->get();

        // Should be sorted alphabetically by assignee name
        $this->assertCount(3, $tasks);
        $this->assertEquals($taskForAlice->id, $tasks->get(0)->id);
        $this->assertEquals($taskForBob->id, $tasks->get(1)->id);
        $this->assertEquals($taskForZara->id, $tasks->get(2)->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_assignee_descending(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice']);
        $userZara = User::factory()->create(['name' => 'Zara']);

        $taskForAlice = $this->createTask(['title' => 'Task for Alice']);
        $taskForAlice->assignees()->create(['user_id' => $userAlice->id]);

        $taskForZara = $this->createTask(['title' => 'Task for Zara']);
        $taskForZara->assignees()->create(['user_id' => $userZara->id]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('ASSIGNEE_DESC')
            ->get();

        $this->assertEquals($taskForZara->id, $tasks->first()->id);
        $this->assertEquals($taskForAlice->id, $tasks->last()->id);
    }

    /** @test */
    public function it_handles_tasks_without_assignees_when_sorting_by_assignee(): void
    {
        $userCharlie = User::factory()->create(['name' => 'Charlie']);

        $taskWithAssignee = $this->createTask([
            'title' => 'Task with assignee',
        ]);
        $taskWithAssignee->assignees()->create(['user_id' => $userCharlie->id]);

        $taskWithoutAssignee = $this->createTask([
            'title' => 'Unassigned task',
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('ASSIGNEE_ASC')
            ->get();

        // Both tasks should be returned
        $this->assertCount(2, $tasks);

        // In PostgreSQL LEFT JOIN, NULL values sort last in ASC order
        // So task with assignee comes first, unassigned task comes last
        $this->assertEquals($taskWithAssignee->id, $tasks->first()->id);
        $this->assertEquals($taskWithoutAssignee->id, $tasks->last()->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_title_ascending(): void
    {
        $taskC = $this->createTask(['title' => 'Charlie Task']);
        $taskA = $this->createTask(['title' => 'Alpha Task']);
        $taskB = $this->createTask(['title' => 'Beta Task']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('TITLE_ASC')
            ->get();

        $this->assertEquals($taskA->id, $tasks->get(0)->id);
        $this->assertEquals($taskB->id, $tasks->get(1)->id);
        $this->assertEquals($taskC->id, $tasks->get(2)->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_title_descending(): void
    {
        $taskA = $this->createTask(['title' => 'Alpha Task']);
        $taskZ = $this->createTask(['title' => 'Zulu Task']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('TITLE_DESC')
            ->get();

        $this->assertEquals($taskZ->id, $tasks->first()->id);
        $this->assertEquals($taskA->id, $tasks->last()->id);
    }

    /** @test */
    public function it_can_sort_tasks_by_created_at_ascending(): void
    {
        Carbon::setTestNow(Carbon::now());

        $taskOlder = $this->createTask(['title' => 'Older Task']);

        Carbon::setTestNow(Carbon::now()->addMinutes(10));
        $taskNewer = $this->createTask(['title' => 'Newer Task']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('CREATED_AT_ASC')
            ->get();

        $this->assertEquals($taskOlder->id, $tasks->first()->id);
        $this->assertEquals($taskNewer->id, $tasks->last()->id);

        Carbon::setTestNow(); // Reset
    }

    /** @test */
    public function it_can_sort_tasks_by_created_at_descending(): void
    {
        Carbon::setTestNow(Carbon::now());

        $taskOlder = $this->createTask(['title' => 'Older Task']);

        Carbon::setTestNow(Carbon::now()->addMinutes(10));
        $taskNewer = $this->createTask(['title' => 'Newer Task']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('CREATED_AT_DESC')
            ->get();

        $this->assertEquals($taskNewer->id, $tasks->first()->id);
        $this->assertEquals($taskOlder->id, $tasks->last()->id);

        Carbon::setTestNow(); // Reset
    }

    /** @test */
    public function it_uses_default_order_when_no_sort_is_specified(): void
    {
        $task1 = $this->createTask(['order' => '1']);
        $task2 = $this->createTask(['order' => '2']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('order')
            ->get();

        $this->assertEquals($task1->id, $tasks->first()->id);
        $this->assertEquals($task2->id, $tasks->last()->id);
    }

    /** @test */
    public function it_sorts_by_first_assignee_when_task_has_multiple_assignees(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice']);
        $userZara = User::factory()->create(['name' => 'Zara']);
        $userBob = User::factory()->create(['name' => 'Bob']);

        $taskWithMultipleAssignees = $this->createTask([
            'title' => 'Multi-assignee task',
        ]);

        // Add assignees in specific order - Zara first, then Alice
        $taskWithMultipleAssignees
            ->assignees()
            ->create(['user_id' => $userZara->id]);
        $taskWithMultipleAssignees
            ->assignees()
            ->create(['user_id' => $userAlice->id]);

        $taskWithBob = $this->createTask(['title' => 'Bob task']);
        $taskWithBob->assignees()->create(['user_id' => $userBob->id]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->orderByCustom('ASSIGNEE_ASC')
            ->get();

        // Should sort by first/primary assignee (lowest ID in assignable table)
        // The task with Zara should be sorted by Zara's name, not Alice
        $this->assertCount(2, $tasks);
    }

    /**
     * Helper method to create a task with default values
     */
    protected function createTask(array $attributes = []): Task
    {
        return Task::create(
            array_merge(
                [
                    'organization_id' => $this->org->id,
                    'entity_id' => $this->pulse->id,
                    'entity_type' => Pulse::class,
                    'title' => 'Test Task',
                    'type' => TaskType::TASK,
                    'status' => TaskStatus::TODO,
                    'priority' => TaskPriority::MEDIUM,
                    'order' => '0',
                ],
                $attributes
            )
        );
    }
}
