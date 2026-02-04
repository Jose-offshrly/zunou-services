<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Summary;

final readonly class DeleteMeetingSummaryMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): array
    {
        try {
            $input = $args['input'];
            $summary = Summary::find($input['id']);
            if (!$summary) {
                throw new \Exception('Summary not found');
            }
            $summary->delete();
            return [
                "success" => true,
                "message" => "Summary deleted successfully",
            ];
        } catch (\Throwable $th) {
            return [
                "success" => false,
                "message" => "Failed to delete summary: " . $th->getMessage(),
            ];
        }
    }
}