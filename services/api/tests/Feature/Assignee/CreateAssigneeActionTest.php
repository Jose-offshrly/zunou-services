<?php

declare(strict_types=1);

namespace Tests\Feature\Assignee;

use App\Actions\Assignee\CreateAssigneeAction;
use App\Models\Assignee;
use App\Models\Task;
use App\Models\User;
use Tests\TestCase;

class CreateAssigneeActionTest extends TestCase
{
    public function test_it_can_create_an_assignee_resource(): void
    {
        $task = Task::first();
        $user = User::first();

        $action = app(CreateAssigneeAction::class);

        $assignee = $action->handle(entity: $task, user: $user);

        $this->assertInstanceOf(Assignee::class, $assignee);
        $this->assertInstanceOf(User::class, $assignee->user);
        $this->assertInstanceOf(Task::class, $assignee->entity);
    }
}
