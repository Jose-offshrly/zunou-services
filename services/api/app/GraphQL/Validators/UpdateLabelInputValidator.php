<?php

declare(strict_types=1);

namespace App\GraphQL\Validators;

use Illuminate\Validation\Rule;
use Nuwave\Lighthouse\Validation\Validator;

class UpdateLabelInputValidator extends Validator
{
    public function rules(): array
    {
        $pulseId = $this->arg('pulse_id');
        $labelId = $this->arg('id');

        return [
            'id'   => ['required', 'uuid'],
            'name' => [
                'required',
                Rule::unique('labels', 'name')
                    ->where('pulse_id', $pulseId)
                    ->ignore($labelId, 'id'),
            ],
            'pulse_id' => ['required', 'uuid'],
            'color'    => ['nullable', 'string'],
        ];
    }
}
