<?php

namespace Tests\Feature;

use App\Services\Agents\Helpers\UpdateTasksHelper;
use Tests\TestCase;

class UpdateTaskHelperTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_it_should_update_task_properties(): void
    {
        $orgId   = '';
        $pulseId = '';

        $tasks = [
            [
                'id'          => '5c6be314-ced8-4618-a980-34d426377e0a',
                'title'       => 'Implement Password Reset API Endpoint - Graph',
                'description' => '',
                'status'      => 'INPROGRESS',
                'due_date'    => '06/01/2025',
                'priority'    => 'LOW',
            ],
        ];

        $helper  = new UpdateTasksHelper($orgId, $pulseId);
        $results = $helper->execute($tasks);

        $this->assertIsArray($results);
        $this->assertArrayHasKey('errors', $results);
        $this->assertArrayHasKey('success', $results);

        $this->assertEmpty(
            $results['errors'],
            'Expected no errors during task update.',
        );

        $this->assertCount(1, $results['success']);
        $updatedTask = $results['success'][0];

        $this->assertEquals(
            '5c6be314-ced8-4618-a980-34d426377e0a',
            $updatedTask['id'],
        );
        $this->assertEquals(
            'Implement Password Reset API Endpoint - Graph',
            $updatedTask['title'],
        );
        $this->assertEquals('', $updatedTask['description']);
        $this->assertEquals('INPROGRESS', $updatedTask['status']);

        // date should be normalize
        $this->assertEquals('2025-06-01', $updatedTask['due_date']);
        $this->assertEquals('LOW', $updatedTask['priority']);
    }

    public function test_it_should_return_tasks_that_failed_to_update_with_error_message(): void
    {
        $orgId   = '';
        $pulseId = '';

        $tasks = [
            [
                'id'          => '5c6be314-ced8-4618-a980-34d426377e0a',
                'title'       => 'Implement Password Reset API Endpoint - Graph',
                'description' => '',
                'status'      => 'INPROGRESS',
                'due_date'    => '06/01/2025',
                'priority'    => 'LOW',
            ],
            [
                'id'          => '5f7aae93-fe1a-4e9a-ba08-fb3ce26731b5',
                'title'       => 'Develop api for creating TODO',
                'description' => 'test description',
                'status'      => 'INPROGRESS',
                'due_date'    => 'xxx',
                'priority'    => 'LOW',
            ],
        ];

        $helper  = new UpdateTasksHelper($orgId, $pulseId);
        $results = $helper->execute($tasks);

        // One error
        $this->assertCount(1, $results['errors']);
        $errorEntry = $results['errors'][0];

        $this->assertArrayHasKey('task', $errorEntry);
        $this->assertEquals(
            '5f7aae93-fe1a-4e9a-ba08-fb3ce26731b5',
            $errorEntry['task']['id'],
        );
        $this->assertEquals('xxx', $errorEntry['task']['due_date']);
        $this->assertEquals('Invalid due date: xxx', $errorEntry['error']);

        // One success
        $this->assertCount(1, $results['success']);
        $successEntry = $results['success'][0];

        $this->assertEquals(
            '5c6be314-ced8-4618-a980-34d426377e0a',
            $successEntry['id'],
        );
        $this->assertEquals('2025-06-01', $successEntry['due_date']);
    }

    public function test_it_should_add_and_remove_one_or_more_member_to_task(): void
    {
        $orgId   = '9de646fb-0a17-4398-84de-94ea50fd562e';
        $pulseId = '2fd01c1f-c723-48f4-934e-5da345a5ebc1';
        $taskId  = '5f7aae93-fe1a-4e9a-ba08-fb3ce26731b5';

        $helper = new UpdateTasksHelper($orgId, $pulseId);

        $tasks = [
            [
                'id'            => $taskId,
                'add_assignees' => [
                    [
                        'id'   => '',
                        'name' => 'tyrone',
                    ],
                ],
            ],
        ];

        $results = $helper->execute($tasks);

        $updatedTask = $results['success'][0];
        $asigneeId   = $updatedTask['add_assignees'][0]['id'];

        $this->assertEmpty(
            $results['errors'],
            'There should be no errors when adding assignee.',
        );
        $this->assertCount(1, $results['success']);

        //  Assert assignee exists in DB
        $this->assertDatabaseHas('assignees', [
            'entity_id' => $taskId,
            'user_id'   => $asigneeId,
        ]);

        $tasks = [
            [
                'id'               => $taskId,
                'remove_assignees' => [
                    [
                        'id'   => '',
                        'name' => 'tyrone',
                    ],
                ],
            ],
        ];

        $results = $helper->execute($tasks);

        $updatedTask = $results['success'][0];
        $asigneeId   = $updatedTask['remove_assignees'][0]['id'];

        $this->assertEmpty(
            $results['errors'],
            'There should be no errors when adding assignee.',
        );
        $this->assertCount(1, $results['success']);

        $this->assertDatabaseMissing('assignees', [
            'entity_id' => $taskId,
            'user_id'   => $asigneeId,
        ]);
    }
}
