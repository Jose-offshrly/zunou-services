<?php

namespace Tests\Feature\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TaskFilteringTest extends TestCase
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
    public function it_can_filter_tasks_by_status(): void
    {
        $taskTodo = $this->createTask(['status' => TaskStatus::TODO]);
        $taskInProgress = $this->createTask([
            'status' => TaskStatus::INPROGRESS,
        ]);
        $taskCompleted = $this->createTask(['status' => TaskStatus::COMPLETED]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByStatus(TaskStatus::TODO)
            ->get();

        $this->assertCount(1, $tasks);
        $this->assertEquals($taskTodo->id, $tasks->first()->id);
    }

    /** @test */
    public function it_can_exclude_tasks_by_status(): void
    {
        $taskTodo = $this->createTask(['status' => TaskStatus::TODO]);
        $taskInProgress = $this->createTask([
            'status' => TaskStatus::INPROGRESS,
        ]);
        $taskCompleted = $this->createTask(['status' => TaskStatus::COMPLETED]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByStatus(TaskStatus::COMPLETED, true)
            ->get();

        // Should return only non-completed tasks
        $this->assertCount(2, $tasks);
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($taskTodo->id, $taskIds);
        $this->assertContains($taskInProgress->id, $taskIds);
        $this->assertNotContains($taskCompleted->id, $taskIds);
    }

    /** @test */
    public function it_can_filter_tasks_by_priority(): void
    {
        $taskUrgent = $this->createTask(['priority' => TaskPriority::URGENT]);
        $taskHigh = $this->createTask(['priority' => TaskPriority::HIGH]);
        $taskMedium = $this->createTask(['priority' => TaskPriority::MEDIUM]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByPriority(TaskPriority::URGENT)
            ->get();

        $this->assertCount(1, $tasks);
        $this->assertEquals($taskUrgent->id, $tasks->first()->id);
    }

    /** @test */
    public function it_can_exclude_tasks_by_priority(): void
    {
        $taskUrgent = $this->createTask(['priority' => TaskPriority::URGENT]);
        $taskHigh = $this->createTask(['priority' => TaskPriority::HIGH]);
        $taskMedium = $this->createTask(['priority' => TaskPriority::MEDIUM]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByPriority(TaskPriority::LOW, true)
            ->get();

        // Should return all tasks since none are LOW priority
        $this->assertCount(3, $tasks);
    }

    /** @test */
    public function it_can_filter_tasks_by_assignee(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice']);
        $userBob = User::factory()->create(['name' => 'Bob']);

        $taskForAlice = $this->createTask(['title' => 'Task for Alice']);
        $taskForAlice->assignees()->create(['user_id' => $userAlice->id]);

        $taskForBob = $this->createTask(['title' => 'Task for Bob']);
        $taskForBob->assignees()->create(['user_id' => $userBob->id]);

        $taskUnassigned = $this->createTask(['title' => 'Unassigned']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByAssignee($userAlice->id)
            ->get();

        $this->assertCount(1, $tasks);
        $this->assertEquals($taskForAlice->id, $tasks->first()->id);
    }

    /** @test */
    public function it_can_exclude_tasks_by_assignee(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice']);
        $userBob = User::factory()->create(['name' => 'Bob']);

        $taskForAlice = $this->createTask(['title' => 'Task for Alice']);
        $taskForAlice->assignees()->create(['user_id' => $userAlice->id]);

        $taskForBob = $this->createTask(['title' => 'Task for Bob']);
        $taskForBob->assignees()->create(['user_id' => $userBob->id]);

        $taskUnassigned = $this->createTask(['title' => 'Unassigned']);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByAssignee($userAlice->id, true)
            ->get();

        // Should return Bob's task and unassigned task
        $this->assertCount(2, $tasks);
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($taskForBob->id, $taskIds);
        $this->assertContains($taskUnassigned->id, $taskIds);
        $this->assertNotContains($taskForAlice->id, $taskIds);
    }

    /** @test */
    public function it_can_combine_positive_and_negative_filters(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice']);

        $taskUrgentCompleted = $this->createTask([
            'priority' => TaskPriority::URGENT,
            'status' => TaskStatus::COMPLETED,
        ]);
        $taskUrgentCompleted
            ->assignees()
            ->create(['user_id' => $userAlice->id]);

        $taskUrgentTodo = $this->createTask([
            'priority' => TaskPriority::URGENT,
            'status' => TaskStatus::TODO,
        ]);
        $taskUrgentTodo->assignees()->create(['user_id' => $userAlice->id]);

        $taskHighTodo = $this->createTask([
            'priority' => TaskPriority::HIGH,
            'status' => TaskStatus::TODO,
        ]);
        $taskHighTodo->assignees()->create(['user_id' => $userAlice->id]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByAssignee($userAlice->id)
            ->filterByPriority(TaskPriority::URGENT)
            ->filterByStatus(TaskStatus::COMPLETED, true)
            ->get();

        // Should return only urgent, non-completed tasks assigned to Alice
        $this->assertCount(1, $tasks);
        $this->assertEquals($taskUrgentTodo->id, $tasks->first()->id);
    }

    /** @test */
    public function it_can_filter_by_multiple_exclude_conditions(): void
    {
        $taskUrgentCompleted = $this->createTask([
            'priority' => TaskPriority::URGENT,
            'status' => TaskStatus::COMPLETED,
        ]);

        $taskUrgentTodo = $this->createTask([
            'priority' => TaskPriority::URGENT,
            'status' => TaskStatus::TODO,
        ]);

        $taskHighCompleted = $this->createTask([
            'priority' => TaskPriority::HIGH,
            'status' => TaskStatus::COMPLETED,
        ]);

        $taskHighTodo = $this->createTask([
            'priority' => TaskPriority::HIGH,
            'status' => TaskStatus::TODO,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByStatus(TaskStatus::COMPLETED, true)
            ->filterByPriority(TaskPriority::LOW, true)
            ->get();

        // Should return all non-completed, non-LOW priority tasks
        $this->assertCount(2, $tasks);
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($taskUrgentTodo->id, $taskIds);
        $this->assertContains($taskHighTodo->id, $taskIds);
    }

    /** @test */
    public function exclude_status_only_filters_parent_tasks(): void
    {
        // Create parent list
        $parentList = $this->createTask([
            'title' => 'Task List',
            'type' => TaskType::LIST,
            'status' => TaskStatus::TODO,
        ]);

        // Create child task with COMPLETED status
        $childCompleted = $this->createTask([
            'title' => 'Child Task',
            'status' => TaskStatus::COMPLETED,
            'parent_id' => $parentList->id,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByStatus(TaskStatus::COMPLETED, true)
            ->get();

        // Parent should be returned because parent-level filtering ignores children
        $this->assertCount(1, $tasks);
        $this->assertEquals($parentList->id, $tasks->first()->id);
    }

    /** @test */
    public function exclude_priority_only_filters_parent_tasks(): void
    {
        // Create parent list
        $parentList = $this->createTask([
            'title' => 'Task List',
            'type' => TaskType::LIST,
            'priority' => TaskPriority::MEDIUM,
        ]);

        // Create child task with URGENT priority
        $childUrgent = $this->createTask([
            'title' => 'Child Task',
            'priority' => TaskPriority::URGENT,
            'parent_id' => $parentList->id,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByPriority(TaskPriority::URGENT, true)
            ->get();

        // Parent should be returned (not URGENT), child is excluded from query
        $this->assertCount(1, $tasks);
        $this->assertEquals($parentList->id, $tasks->first()->id);
    }

    /** @test */
    public function exclude_assignee_only_filters_parent_tasks(): void
    {
        $userAlice = User::factory()->create(['name' => 'Alice']);
        $userBob = User::factory()->create(['name' => 'Bob']);

        // Create parent list assigned to Bob
        $parentList = $this->createTask([
            'title' => 'Task List',
            'type' => TaskType::LIST,
        ]);
        $parentList->assignees()->create(['user_id' => $userBob->id]);

        // Create child task assigned to Alice
        $childTask = $this->createTask([
            'title' => 'Child Task',
            'parent_id' => $parentList->id,
        ]);
        $childTask->assignees()->create(['user_id' => $userAlice->id]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByAssignee($userAlice->id, true)
            ->get();

        // Parent should be returned (not assigned to Alice), child is excluded from query
        $this->assertCount(1, $tasks);
        $this->assertEquals($parentList->id, $tasks->first()->id);
    }

    /** @test */
    public function it_handles_null_values_in_exclude_filters(): void
    {
        $task = $this->createTask();

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByStatus(null, true)
            ->filterByPriority(null, true)
            ->filterByAssignee(null, true)
            ->get();

        // Should return all tasks when exclude values are null
        $this->assertCount(1, $tasks);
    }

    /** @test */
    public function it_can_filter_by_date_range(): void
    {
        $taskToday = $this->createTask([
            'due_date' => Carbon::today(),
        ]);

        $taskTomorrow = $this->createTask([
            'due_date' => Carbon::tomorrow(),
        ]);

        $taskNextWeek = $this->createTask([
            'due_date' => Carbon::now()->addWeek(),
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByDateRange([
                'from' => Carbon::today()->toDateString(),
                'to' => Carbon::tomorrow()->toDateString(),
            ])
            ->get();

        $this->assertCount(2, $tasks);
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($taskToday->id, $taskIds);
        $this->assertContains($taskTomorrow->id, $taskIds);
        $this->assertNotContains($taskNextWeek->id, $taskIds);
    }

    /** @test */
    public function it_can_filter_by_search(): void
    {
        $taskProject = $this->createTask(['title' => 'Project Alpha']);
        $taskBug = $this->createTask(['title' => 'Fix bug in authentication']);
        $taskFeature = $this->createTask([
            'title' => 'Add new feature to dashboard',
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterBySearch('bug')
            ->get();

        $this->assertCount(1, $tasks);
        $this->assertEquals($taskBug->id, $tasks->first()->id);
    }

    /** @test */
    public function exclude_priority_includes_null_priority_tasks(): void
    {
        // Create tasks with NULL and HIGH priority
        $taskWithNullPriority = $this->createTask(['priority' => null]);
        $taskWithHighPriority = $this->createTask([
            'priority' => TaskPriority::HIGH,
        ]);
        $taskWithMediumPriority = $this->createTask([
            'priority' => TaskPriority::MEDIUM,
        ]);

        // Query with excludePriority=HIGH (backward compatible mode)
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByPriority(TaskPriority::HIGH, true, false)
            ->get();

        // Should include NULL priority task and MEDIUM, exclude HIGH
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($taskWithNullPriority->id, $taskIds);
        $this->assertContains($taskWithMediumPriority->id, $taskIds);
        $this->assertNotContains($taskWithHighPriority->id, $taskIds);
    }

    /** @test */
    public function exclude_status_includes_null_status_tasks(): void
    {
        // Create tasks with NULL and TODO status
        $taskWithNullStatus = $this->createTask(['status' => null]);
        $taskWithTodoStatus = $this->createTask([
            'status' => TaskStatus::TODO,
        ]);
        $taskWithInProgressStatus = $this->createTask([
            'status' => TaskStatus::INPROGRESS,
        ]);

        // Query with excludeStatus=TODO (backward compatible mode)
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByStatus(TaskStatus::TODO, true, false)
            ->get();

        // Should include NULL status task and INPROGRESS, exclude TODO
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($taskWithNullStatus->id, $taskIds);
        $this->assertContains($taskWithInProgressStatus->id, $taskIds);
        $this->assertNotContains($taskWithTodoStatus->id, $taskIds);
    }

    /** @test */
    public function exclude_status_with_children_uses_or_logic(): void
    {
        // Create parent list with COMPLETED status and mixed children
        $parentListMixed = $this->createTask([
            'status' => TaskStatus::COMPLETED,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $childTaskTodo = $this->createTask([
            'parent_id' => $parentListMixed->id,
            'status' => TaskStatus::TODO,
        ]);

        $childTaskCompleted = $this->createTask([
            'parent_id' => $parentListMixed->id,
            'status' => TaskStatus::COMPLETED,
        ]);

        // Create parent with ALL TODO (parent + children)
        $parentAllTodo = $this->createTask([
            'status' => TaskStatus::TODO,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $childAllTodo = $this->createTask([
            'parent_id' => $parentAllTodo->id,
            'status' => TaskStatus::TODO,
        ]);

        // Query with excludeStatus=TODO and excludeWithChildren=true
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByStatus(TaskStatus::TODO, true, true)
            ->get();

        $taskIds = $tasks->pluck('id')->toArray();
        // Should INCLUDE parent with mixed children (parent is COMPLETED OR child is COMPLETED)
        $this->assertContains($parentListMixed->id, $taskIds);
        // Should EXCLUDE parent where all are TODO (parent is TODO AND all children are TODO)
        $this->assertNotContains($parentAllTodo->id, $taskIds);
    }

    /** @test */
    public function exclude_priority_with_children_uses_or_logic(): void
    {
        // This is the exact scenario requested: parent with MEDIUM and HIGH children
        // Excluding MEDIUM should INCLUDE the parent because HIGH child exists
        $parentListMixed = $this->createTask([
            'priority' => null,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $childMedium = $this->createTask([
            'parent_id' => $parentListMixed->id,
            'priority' => TaskPriority::MEDIUM,
        ]);

        $childHigh = $this->createTask([
            'parent_id' => $parentListMixed->id,
            'priority' => TaskPriority::HIGH,
        ]);

        // Create parent with ALL MEDIUM
        $parentAllMedium = $this->createTask([
            'priority' => TaskPriority::MEDIUM,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $childAllMedium = $this->createTask([
            'parent_id' => $parentAllMedium->id,
            'priority' => TaskPriority::MEDIUM,
        ]);

        // Query with excludePriority=MEDIUM and excludeWithChildren=true
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByPriority(TaskPriority::MEDIUM, true, true)
            ->get();

        $taskIds = $tasks->pluck('id')->toArray();
        // Should INCLUDE parent with mixed children (has HIGH child that is not MEDIUM)
        $this->assertContains($parentListMixed->id, $taskIds);
        // Should EXCLUDE parent where all are MEDIUM
        $this->assertNotContains($parentAllMedium->id, $taskIds);
    }

    /** @test */
    public function exclude_assignee_with_children_uses_or_logic(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create parent list with mixed assignees
        $parentListMixed = $this->createTask([
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $childUser1 = $this->createTask([
            'parent_id' => $parentListMixed->id,
        ]);
        $childUser1->assignees()->create(['user_id' => $user1->id]);

        $childUser2 = $this->createTask([
            'parent_id' => $parentListMixed->id,
        ]);
        $childUser2->assignees()->create(['user_id' => $user2->id]);

        // Create parent where ALL are assigned to user1
        $parentAllUser1 = $this->createTask([
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);
        $parentAllUser1->assignees()->create(['user_id' => $user1->id]);

        $childAllUser1 = $this->createTask([
            'parent_id' => $parentAllUser1->id,
        ]);
        $childAllUser1->assignees()->create(['user_id' => $user1->id]);

        // Query with excludeAssigneeId=user1 and excludeWithChildren=true
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByAssignee($user1->id, true, true)
            ->get();

        $taskIds = $tasks->pluck('id')->toArray();
        // Should INCLUDE parent with mixed assignees (has user2 child)
        $this->assertContains($parentListMixed->id, $taskIds);
        // Should EXCLUDE parent where all are assigned to user1
        $this->assertNotContains($parentAllUser1->id, $taskIds);
    }

    /** @test */
    public function backward_compatibility_exclude_filters_without_children_check(): void
    {
        // Create parent list with MEDIUM priority
        $parentList = $this->createTask([
            'priority' => TaskPriority::MEDIUM,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        // Create child task with HIGH priority
        $childTaskHigh = $this->createTask([
            'parent_id' => $parentList->id,
            'priority' => TaskPriority::HIGH,
        ]);

        // Query with excludePriority=HIGH but excludeWithChildren=false (old behavior)
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByPriority(TaskPriority::HIGH, true, false)
            ->get();

        // Should INCLUDE parent list (old behavior only checks parent level)
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($parentList->id, $taskIds);
    }

    /** @test */
    public function exclude_filter_with_no_children_excludes_parent(): void
    {
        // Parent with excluded value, no children
        $parentTask = $this->createTask([
            'status' => TaskStatus::TODO,
            'type' => TaskType::TASK,
        ]);

        // Parent with non-excluded value, no children
        $parentTask2 = $this->createTask([
            'status' => TaskStatus::COMPLETED,
            'type' => TaskType::TASK,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByStatus(TaskStatus::TODO, true, true)
            ->get();

        $taskIds = $tasks->pluck('id')->toArray();
        // Should EXCLUDE parent with excluded status and no children
        $this->assertNotContains($parentTask->id, $taskIds);
        // Should INCLUDE parent with non-excluded status
        $this->assertContains($parentTask2->id, $taskIds);
    }

    /** @test */
    public function exclude_filter_includes_parent_with_null_value_and_non_excluded_child(): void
    {
        // Parent with NULL status
        $parentList = $this->createTask([
            'status' => null,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $childCompleted = $this->createTask([
            'parent_id' => $parentList->id,
            'status' => TaskStatus::COMPLETED,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByStatus(TaskStatus::TODO, true, true)
            ->get();

        // Should INCLUDE because parent is NULL (not TODO) OR child is COMPLETED (not TODO)
        $this->assertContains($parentList->id, $tasks->pluck('id'));
    }

    /** @test */
    public function exclude_filter_with_all_null_children_includes_parent(): void
    {
        // Parent and all children have NULL for excluded field
        $parentList = $this->createTask([
            'priority' => null,
            'type' => TaskType::LIST,
            'parent_id' => null,
        ]);

        $child1 = $this->createTask([
            'parent_id' => $parentList->id,
            'priority' => null,
        ]);

        $child2 = $this->createTask([
            'parent_id' => $parentList->id,
            'priority' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByPriority(TaskPriority::HIGH, true, true)
            ->get();

        // Should INCLUDE because parent is NULL (not HIGH) OR children are NULL (not HIGH)
        $this->assertContains($parentList->id, $tasks->pluck('id'));
    }

    /** @test */
    public function it_can_filter_for_scheduled_tasks(): void
    {
        $scheduledWithBothDates = $this->createTask([
            'title' => 'Task with both dates',
            'start_date' => Carbon::now(),
            'due_date' => Carbon::now()->addDays(3),
        ]);

        $scheduledWithStartDate = $this->createTask([
            'title' => 'Task with start date only',
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        $scheduledWithDueDate = $this->createTask([
            'title' => 'Task with due date only',
            'start_date' => null,
            'due_date' => Carbon::now()->addDays(3),
        ]);

        $unscheduled = $this->createTask([
            'title' => 'Unscheduled task',
            'start_date' => null,
            'due_date' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByScheduled(true)
            ->get();

        // Should return all tasks with at least one date
        $this->assertCount(3, $tasks);
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($scheduledWithBothDates->id, $taskIds);
        $this->assertContains($scheduledWithStartDate->id, $taskIds);
        $this->assertContains($scheduledWithDueDate->id, $taskIds);
        $this->assertNotContains($unscheduled->id, $taskIds);
    }

    /** @test */
    public function it_can_filter_for_unscheduled_tasks(): void
    {
        $scheduledWithBothDates = $this->createTask([
            'title' => 'Task with both dates',
            'start_date' => Carbon::now(),
            'due_date' => Carbon::now()->addDays(3),
        ]);

        $scheduledWithStartDate = $this->createTask([
            'title' => 'Task with start date only',
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        $scheduledWithDueDate = $this->createTask([
            'title' => 'Task with due date only',
            'start_date' => null,
            'due_date' => Carbon::now()->addDays(3),
        ]);

        $unscheduled = $this->createTask([
            'title' => 'Unscheduled task',
            'start_date' => null,
            'due_date' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByScheduled(false)
            ->get();

        // Should return only tasks with both dates null
        $this->assertCount(1, $tasks);
        $this->assertEquals($unscheduled->id, $tasks->first()->id);
    }

    /** @test */
    public function it_includes_children_when_filtering_scheduled_tasks(): void
    {
        // Parent list is unscheduled
        $parentList = $this->createTask([
            'title' => 'Parent List',
            'type' => TaskType::LIST,
            'parent_id' => null,
            'start_date' => null,
            'due_date' => null,
        ]);

        // Child task is scheduled
        $childScheduled = $this->createTask([
            'title' => 'Scheduled child',
            'parent_id' => $parentList->id,
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByScheduled(true)
            ->get();

        // Should include parent list because child is scheduled
        $this->assertCount(1, $tasks);
        $this->assertEquals($parentList->id, $tasks->first()->id);
    }

    /** @test */
    public function it_includes_children_when_filtering_unscheduled_tasks(): void
    {
        // Parent list is scheduled
        $parentList = $this->createTask([
            'title' => 'Parent List',
            'type' => TaskType::LIST,
            'parent_id' => null,
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        // Child task is unscheduled
        $childUnscheduled = $this->createTask([
            'title' => 'Unscheduled child',
            'parent_id' => $parentList->id,
            'start_date' => null,
            'due_date' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByScheduled(false)
            ->get();

        // Should include parent list because child is unscheduled
        $this->assertCount(1, $tasks);
        $this->assertEquals($parentList->id, $tasks->first()->id);
    }

    /** @test */
    public function it_excludes_parents_with_scheduled_children_when_filtering_unscheduled_with_children(): void
    {
        // Parent list is unscheduled but has scheduled child
        $parentWithScheduledChild = $this->createTask([
            'title' => 'Parent with scheduled child',
            'type' => TaskType::LIST,
            'parent_id' => null,
            'start_date' => null,
            'due_date' => null,
        ]);

        $childScheduled = $this->createTask([
            'title' => 'Scheduled child',
            'parent_id' => $parentWithScheduledChild->id,
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        // Parent list is unscheduled with unscheduled child
        $parentFullyUnscheduled = $this->createTask([
            'title' => 'Parent fully unscheduled',
            'type' => TaskType::LIST,
            'parent_id' => null,
            'start_date' => null,
            'due_date' => null,
        ]);

        $childUnscheduled = $this->createTask([
            'title' => 'Unscheduled child',
            'parent_id' => $parentFullyUnscheduled->id,
            'start_date' => null,
            'due_date' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByScheduled(false, true)
            ->get();

        // Should only include parent with fully unscheduled children
        $this->assertCount(1, $tasks);
        $this->assertEquals($parentFullyUnscheduled->id, $tasks->first()->id);
    }

    /** @test */
    public function it_does_not_apply_filter_when_scheduled_is_null(): void
    {
        $scheduled = $this->createTask([
            'title' => 'Scheduled task',
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        $unscheduled = $this->createTask([
            'title' => 'Unscheduled task',
            'start_date' => null,
            'due_date' => null,
        ]);

        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->filterByScheduled(null)
            ->get();

        // Should return all tasks (no filter applied)
        $this->assertCount(2, $tasks);
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($scheduled->id, $taskIds);
        $this->assertContains($unscheduled->id, $taskIds);
    }

    /** @test */
    public function backward_compatibility_unscheduled_filter_without_children_check(): void
    {
        // Create parent list that is unscheduled
        $parentList = $this->createTask([
            'title' => 'Unscheduled parent',
            'type' => TaskType::LIST,
            'parent_id' => null,
            'start_date' => null,
            'due_date' => null,
        ]);

        // Create child task that is scheduled
        $childScheduled = $this->createTask([
            'title' => 'Scheduled child',
            'parent_id' => $parentList->id,
            'start_date' => Carbon::now(),
            'due_date' => null,
        ]);

        // Query with isScheduled=false but excludeWithChildren=false (old behavior)
        $tasks = Task::forOrganization($this->org->id)
            ->forEntity($this->pulse->id)
            ->whereNull('parent_id')
            ->filterByScheduled(false, false)
            ->get();

        // Should INCLUDE parent list (old behavior checks parent OR children)
        $taskIds = $tasks->pluck('id')->toArray();
        $this->assertContains($parentList->id, $taskIds);
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
