<?php

declare(strict_types=1);

namespace App\GraphQL\Validators;

use Illuminate\Validation\Rule;
use Nuwave\Lighthouse\Validation\Validator;

class CreateLabelInputValidator extends Validator
{
    public function rules(): array
    {
        $pulseId = $this->arg('pulse_id');

        return [
            'name' => [
                'required',
                Rule::unique('labels', 'name')->where('pulse_id', $pulseId),
            ],
            'pulse_id' => ['required'],
            'color'    => ['nullable', 'string'],
        ];
    }
}
