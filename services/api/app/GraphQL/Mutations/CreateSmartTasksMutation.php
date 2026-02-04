<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\CreateSmartTasksAction;
use App\Contracts\Taskable;
use App\Models\Pulse;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

readonly class CreateSmartTasksMutation
{
    public function __construct(
        private readonly CreateSmartTasksAction $createSmartTasksAction,
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user found!');
            }

            $args = $args['input'];

            $this->validateInput($args);

            $entity = $this->getEntity($args);

            return $this->createSmartTasksAction->handle(
                taskListId: $args['task_list_id']     ?? null,
                taskListName: $args['task_list_name'] ?? null,
                transcript: $args['transcript'],
                organizationId: $args['organization_id'],
                entity: $entity,
            );
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create smart tasks: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $args): void
    {
        $validator = Validator::make(
            $args,
            [
                'task_list_id'    => 'nullable|string|exists:tasks,id',
                'task_list_name'  => 'nullable|string|min:1|max:255',
                'transcript'      => 'required|string|min:1',
                'organization_id' => 'required|string|exists:organizations,id',
                'entity_id'       => 'required|string',
                'entity_type'     => 'required|string|in:PULSE',
            ],
            [
                'task_list_id.exists'      => 'The specified task list does not exist',
                'task_list_name.string'    => 'Task list name must be a string',
                'task_list_name.min'       => 'Task list name cannot be empty',
                'task_list_name.max'       => 'Task list name cannot exceed 255 characters',
                'transcript.required'      => 'Transcript is required',
                'transcript.string'        => 'Transcript must be a string',
                'transcript.min'           => 'Transcript cannot be empty',
                'organization_id.required' => 'Organization ID is required',
                'organization_id.exists'   => 'The specified organization does not exist',
                'entity_id.required'       => 'Entity ID is required',
                'entity_type.required'     => 'Entity type is required',
                'entity_type.in'           => 'Entity type must be PULSE',
            ],
        );

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }

        // Custom validation: if no task_list_id is provided, task_list_name is required
        if (empty($args['task_list_id']) && empty($args['task_list_name'])) {
            throw new Error(
                'Either task_list_id or task_list_name must be provided',
            );
        }
    }

    private function getEntity(array $args): Taskable
    {
        /** @var Taskable $entity */
        $entity = match ($args['entity_type']) {
            'PULSE' => Pulse::find($args['entity_id']),
            default => throw new Error(
                'Entity not supported: ' . $args['entity_type'],
            ),
        };

        if (! $entity) {
            throw new Error('Entity not found with ID: ' . $args['entity_id']);
        }

        return $entity;
    }
}
