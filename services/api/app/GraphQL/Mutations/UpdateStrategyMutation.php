<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Events\StrategiesUpdated;
use App\Models\Strategy;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;

final readonly class UpdateStrategyMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $goal = Strategy::findOrFail($args['input']['id']);
            $this->validateInput($args['input']);
            $goal->update([
                'name'        => $args['input']['name'],
                'description' => $args['input']['description'],
            ]);
            event(
                new StrategiesUpdated($goal->organization_id, $goal->pulse_id),
            );
            return $goal->fresh();
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update a pulse goal: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input)
    {
        $validator = Validator::make($input, [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }
}
