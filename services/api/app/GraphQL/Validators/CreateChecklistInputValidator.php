<?php

declare(strict_types=1);

namespace App\GraphQL\Validators;

use Illuminate\Validation\Rule;
use Nuwave\Lighthouse\Validation\Validator;

class CreateChecklistInputValidator extends Validator
{
    public function rules(): array
    {
        $eventId = $this->arg('event_id');
        $eventInstanceId = $this->arg('event_instance_id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('checklists', 'name')->where(function ($query) use ($eventId, $eventInstanceId) {
                    if ($eventId) {
                        $query->where('event_id', $eventId);
                    } elseif ($eventInstanceId) {
                        $query->where('event_instance_id', $eventInstanceId);
                    }
                }),
            ],
            'complete'        => ['boolean'],
            'pulse_id'        => ['required', 'uuid', 'exists:pulses,id'],
            'organization_id' => [
                'required',
                'uuid',
                'exists:organizations,id',
            ],
            'event_id' => ['nullable', 'uuid', 'exists:events,id'],
            'event_instance_id' => ['nullable', 'uuid', 'exists:event_instances,id'],
        ];
    }
}
