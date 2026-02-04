<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Pulse;
use App\Models\PulseMember;
use App\Models\User;
use App\Services\Agents\Helpers\TaskQueryBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TaskQueryBuilderTest extends TestCase
{
    // use RefreshDatabase;

    protected function init_organization()
    {
        $org = Organization::withoutEvents(function () {
            return Organization::factory()->create([
                'id'   => (string) Str::orderedUuid(),
                'name' => 'zunou.test',
            ]);
        });

        $pulse1 = Pulse::withoutEvents(function () use ($org) {
            return Pulse::factory()->create([
                'id'              => (string) Str::orderedUuid(),
                'name'            => 'pulse1',
                'organization_id' => $org->id,
            ]);
        });

        $pulse2 = Pulse::withoutEvents(function () use ($org) {
            return Pulse::factory()->create([
                'id'              => (string) Str::orderedUuid(),
                'name'            => 'pulse2',
                'organization_id' => $org->id,
            ]);
        });

        $user1 = User::create([
            'password' => 'pass',
            'name'     => 'Alice Smith',
            'email'    => 'alice@example.com',
        ]);
        $user2 = User::create([
            'password' => 'pass',
            'name'     => 'Bob Dy',
            'email'    => 'bob@example.com',
        ]);
        $user3 = User::create([
            'password' => 'pass',
            'name'     => 'Charlie Gomez',
            'email'    => 'charlie@example.com',
        ]);

        PulseMember::create([
            'pulse_id' => $pulse1->id,
            'user_id'  => $user1->id,
            'role'     => 'STAFF',
        ]);

        PulseMember::create([
            'pulse_id' => $pulse1->id,
            'user_id'  => $user2->id,
            'role'     => 'STAFF',
        ]);

        PulseMember::create([
            'pulse_id' => $pulse2->id,
            'user_id'  => $user3->id,
            'role'     => 'STAFF',
        ]);

        return compact('org', 'pulse1', 'pulse2', 'user1', 'user2', 'user3');
    }

    /** @test */
    public function it_returns_all_users_using_query_builder()
    {
        extract($this->init_organization());

        $intent = [
            'model'   => 'User',
            'columns' => ['id', 'name', 'email'],
            'limit'   => 50,
        ];

        $results = TaskQueryBuilder::fromIntent($intent, $pulse1->id);

        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            ['Alice Smith', 'Bob Dy'],
            $results->pluck('name')->all(),
        );
    }

    /** @test */
    public function it_should_be_able_to_filter_users_by_name()
    {
        extract($this->init_organization());

        $intent = [
            'model'   => 'User',
            'columns' => ['id', 'name'],
            'filters' => [
                [
                    'column'   => 'name',
                    'operator' => 'LIKE',
                    'value'    => '%bob%',
                ],
            ],
            'limit' => 3,
        ];

        $results = TaskQueryBuilder::fromIntent($intent, $pulse1->id);

        $this->assertCount(1, $results);
        $this->assertEqualsCanonicalizing(
            ['Bob Dy'],
            $results->pluck('name')->all(),
        );
    }

    /** @test */
    public function it_shouldnt_reach_users_outside_of_pulse()
    {
        extract($this->init_organization());

        $intent = [
            'model'   => 'User',
            'columns' => ['id', 'name'],
            'filters' => [
                [
                    'column'   => 'name',
                    'operator' => 'LIKE',
                    'value'    => '%charlie%',
                ],
            ],
            'limit' => 3,
        ];

        $results = TaskQueryBuilder::fromIntent($intent, $pulse1->id);

        $this->assertCount(0, $results);
    }

    /** @test */
    public function it_should_filter_tasks_by_status()
    {
        extract($this->init_organization());

        $task1 = $pulse1->tasks()->create([
            'title'  => 'Login API Development',
            'status' => 'OVERDUE',
        ]);

        $task2 = $pulse1->tasks()->create([
            'title'  => 'Register API Development',
            'status' => 'TODO',
        ]);

        $intent = [
            'model'   => 'Task',
            'columns' => ['id', 'title', 'status', 'due_date', 'priority'],
            'filters' => [
                ['column' => 'status', 'operator' => '=', 'value' => 'OVERDUE'],
            ],
            'limit' => 50,
        ];

        $results = TaskQueryBuilder::fromIntent($intent, $pulse1->id);

        $this->assertCount(1, $results);
        $this->assertEqualsCanonicalizing(
            ['Login API Development'],
            $results->pluck('title')->all(),
        );
    }

    /** @test */
    public function it_should_perform_aggregates()
    {
        extract($this->init_organization());

        $task1 = $pulse1->tasks()->create([
            'title'    => 'Login API Development',
            'status'   => 'OVERDUE',
            'due_date' => '2025-05-01',
        ]);

        $task2 = $pulse1->tasks()->create([
            'title'    => 'Register API Development',
            'status'   => 'TODO',
            'due_date' => '2025-04-30',
        ]);

        $intent = [
            'model'     => 'Task',
            'aggregate' => [
                'function' => 'max',
                'column'   => 'due_date',
                'as'       => 'max_due',
            ],
            'filters' => [
                [
                    'column'   => 'status',
                    'operator' => '=',
                    'value'    => 'OVERDUE',
                ],
            ],
        ];

        $results = TaskQueryBuilder::fromIntent($intent, $pulse1->id);

        $this->assertEqualsCanonicalizing(
            ['max_due' => '2025-05-01 00:00:00'],
            $results,
        );
    }
}
