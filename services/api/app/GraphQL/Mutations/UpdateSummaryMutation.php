<?php

namespace App\GraphQL\Mutations;

use App\Actions\Summary\UpdateSummaryAction;
use App\DataTransferObjects\SummaryData;
use App\Models\Summary;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;

final readonly class UpdateSummaryMutation
{
    public function __construct(
        private UpdateSummaryAction $updateSummaryAction,
    ) {
    }

    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Summary
    {
        try {
            $this->validateInput($args['input']);

            return $this->updateSummary($args['input']);
        } catch (\Exception $e) {
            throw new Error('Failed to update summary: ' . $e->getMessage());
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'summary' => 'required|string',
            'name'    => 'required|string',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function updateSummary(array $input): Summary
    {
        $summary = Summary::findOrFail($input['summaryId']);

        if (! $summary) {
            throw new error('Summary not found');
        }

        $data = new SummaryData(
            summary: $input['summary'],
            name: $input['name'],
        );

        return $this->updateSummaryAction->handle(
            data: $data,
            summary: $summary,
        );
    }
}
