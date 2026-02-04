<?php

declare(strict_types=1);

namespace App\GraphQL\Validators;

use Illuminate\Validation\Rule;
use Nuwave\Lighthouse\Validation\Validator;

class UpdateChecklistInputValidator extends Validator
{
    public function rules(): array
    {
        $checklistId = $this->arg('id');

        // Get the checklist model to access event_id
        $checklist = \App\Models\Checklist::find($checklistId);
        $eventId   = $checklist ? $checklist->event_id : null;

        return [
            'id'   => ['required', 'uuid', 'exists:checklists,id'],
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('checklists', 'name')
                    ->where('event_id', $eventId)
                    ->ignore($checklistId, 'id'),
            ],
            'complete' => ['sometimes', 'boolean'],
        ];
    }
}
