<?php

namespace App\GraphQL\Mutations;

use App\Enums\PulseStatusOption;
use App\Models\Pulse;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;

final readonly class UpdatePulseMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Pulse
    {
        try {
            $this->validateInput($args['input']);

            return $this->updatePulse($args['input']);
        } catch (\Exception $e) {
            throw new Error('Failed to update pulse: ' . $e->getMessage());
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'icon'        => 'required|string',
            'name'        => 'required|string',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function updatePulse(array $input): Pulse
    {
        $pulse = Pulse::find($input['pulseId']);

        if (! $pulse) {
            throw new error('Pulse not found');
        }

        $pulse->name         = $input['name'];
        $pulse->description  = $input['description'];
        $pulse->icon         = $input['icon'];
        
        if (isset($input['status_option'])) {
            // GraphQL passes enum case names (e.g., "DEFAULT"), convert to enum instance
            $statusOptionValue = $input['status_option'];
            $pulse->status_option = match ($statusOptionValue) {
                'DEFAULT' => PulseStatusOption::DEFAULT,
                'CUSTOM' => PulseStatusOption::CUSTOM,
                default => PulseStatusOption::tryFrom($statusOptionValue) ?? PulseStatusOption::DEFAULT,
            };
        }
        
        $pulse->save();

        return $pulse->refresh();
    }
}
