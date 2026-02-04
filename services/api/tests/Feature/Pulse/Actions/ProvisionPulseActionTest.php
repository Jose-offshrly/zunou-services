<?php

declare(strict_types=1);

namespace Tests\Feature\Pulse\Actions;

use App\Actions\Pulse\ProvisionPulseAction;
use App\DataTransferObjects\Pulse\PulsePipelineData;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Tests\TestCase;

class ProvisionPulseActionTest extends TestCase
{
    public function test_it_can_create_a_custom_pulse(): void
    {
        /** @var Authenticatable $user */
        $user = User::first();
        $this->actingAs($user);

        $args = [
            'input' => [
                'pulse' => [
                    'name'           => 'Custom Pulse',
                    'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                ],
            ],
        ];

        $data = PulsePipelineData::from($args['input']);

        $action = app(ProvisionPulseAction::class);

        $pulse = $action->handle(data: $data);

        $this->assertInstanceOf(Pulse::class, $pulse);
        $this->assertEquals('Custom Pulse', $pulse->name);
    }

    public function test_it_can_create_a_pulse_with_dependencies(): void
    {
        /** @var Authenticatable $user */
        $user = User::first();
        $this->actingAs($user);

        $args = [
            'input' => [
                'pulse' => [
                    'name'           => 'HR pulse',
                    'masterPulseId'  => '2d8e0143-0f03-4444-972f-de4541f9d72b',
                    'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                ],
                'strategies' => [
                    [
                        'name'           => 'this is mission name',
                        'type'           => 'missions',
                        'description'    => 'this is description',
                        'freeText'       => 'this is free text',
                        'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                    ],
                ],
                'members' => [
                    [
                        'userId' => '9e83cab1-cfa1-4d03-8d7d-54e09e2bdf81',
                        'role'   => 'OWNER',
                    ],
                ],
                'dataSources' => [
                    [
                        'name'            => 'sample datasource',
                        'organization_id' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                        'type'            => 'text',
                        'description'     => 'this is a transcription',
                        'file_key'        => 'organizations/9e/83/ca/b1/6ecf-47db-95f4-dab88f7240b6/data-sources/e5/55/e4/52/228e-481d-8847-4ca526545bb9/e555e452-228e-481d-8847-4ca526545bb9.txt',
                        'file_name'       => 'e555e452-228e-481d-8847-4ca526545bb9.txt',
                    ],
                ],
            ],
        ];

        $data = PulsePipelineData::from($args['input']);

        $action = app(ProvisionPulseAction::class);

        $pulse = $action->handle(data: $data);

        $this->assertInstanceOf(Pulse::class, $pulse);
        $this->assertDatabaseHas('strategies', [
            'pulse_id' => $pulse->id,
            'type'     => 'missions',
        ]);
        $this->assertNotNull($pulse->members);
        $this->assertNotNull($pulse->dataSources);
    }

    public function test_it_can_create_a_pulse_without_strategies(): void
    {
        /** @var Authenticatable $user */
        $user = User::first();
        $this->actingAs($user);

        $args = [
            'input' => [
                'pulse' => [
                    'name'           => 'HR pulse',
                    'masterPulseId'  => '2d8e0143-0f03-4444-972f-de4541f9d72b',
                    'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                ],
                'members' => [
                    [
                        'userId' => '9e83cab1-cfa1-4d03-8d7d-54e09e2bdf81',
                        'role'   => 'OWNER',
                    ],
                ],
                'dataSources' => [
                    [
                        'name'            => 'sample datasource',
                        'organization_id' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                        'type'            => 'text',
                        'description'     => 'this is a transcription',
                        'file_key'        => 'organizations/9e/83/ca/b1/6ecf-47db-95f4-dab88f7240b6/data-sources/e5/55/e4/52/228e-481d-8847-4ca526545bb9/e555e452-228e-481d-8847-4ca526545bb9.txt',
                        'file_name'       => 'e555e452-228e-481d-8847-4ca526545bb9.txt',
                    ],
                ],
            ],
        ];

        $data = PulsePipelineData::from($args['input']);

        $action = app(ProvisionPulseAction::class);

        $pulse = $action->handle(data: $data);

        $this->assertDatabaseMissing('strategies', [
            'pulse_id' => $pulse->id,
            'type'     => 'missions',
        ]);
    }

    public function test_it_can_create_a_pulse_without_members(): void
    {
        /** @var Authenticatable $user */
        $user = User::first();
        $this->actingAs($user);

        $args = [
            'input' => [
                'pulse' => [
                    'name'           => 'HR pulse',
                    'masterPulseId'  => '2d8e0143-0f03-4444-972f-de4541f9d72b',
                    'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                ],
                'strategies' => [
                    [
                        'name'           => 'this is mission name',
                        'type'           => 'missions',
                        'description'    => 'this is description',
                        'freeText'       => 'this is free text',
                        'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                    ],
                ],
                'dataSources' => [
                    [
                        'name'            => 'sample datasource',
                        'organization_id' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                        'type'            => 'text',
                        'description'     => 'this is a transcription',
                        'file_key'        => 'organizations/9e/83/ca/b1/6ecf-47db-95f4-dab88f7240b6/data-sources/e5/55/e4/52/228e-481d-8847-4ca526545bb9/e555e452-228e-481d-8847-4ca526545bb9.txt',
                        'file_name'       => 'e555e452-228e-481d-8847-4ca526545bb9.txt',
                    ],
                ],
            ],
        ];

        $data = PulsePipelineData::from($args['input']);

        $action = app(ProvisionPulseAction::class);

        $pulse = $action->handle(data: $data);

        $this->assertCount(1, $pulse->members);
    }

    public function test_it_can_create_a_pulse_without_data_sources(): void
    {
        /** @var Authenticatable $user */
        $user = User::first();
        $this->actingAs($user);

        $args = [
            'input' => [
                'pulse' => [
                    'name'           => 'HR pulse',
                    'masterPulseId'  => '2d8e0143-0f03-4444-972f-de4541f9d72b',
                    'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                ],
                'strategies' => [
                    [
                        'name'           => 'this is mission name',
                        'type'           => 'missions',
                        'description'    => 'this is description',
                        'freeText'       => 'this is free text',
                        'organizationId' => '9e83cab1-6ecf-47db-95f4-dab88f7240b6',
                    ],
                ],
                'members' => [
                    [
                        'userId' => '9e83cab1-cfa1-4d03-8d7d-54e09e2bdf81',
                        'role'   => 'OWNER',
                    ],
                ],
            ],
        ];

        $data = PulsePipelineData::from($args['input']);

        $action = app(ProvisionPulseAction::class);

        $pulse = $action->handle(data: $data);

        $this->assertCount(0, $pulse->dataSources);
    }
}
