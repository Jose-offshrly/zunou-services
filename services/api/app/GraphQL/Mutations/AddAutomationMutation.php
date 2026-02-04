<?php

namespace App\GraphQL\Mutations;

use App\Services\StrategyService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

final class AddAutomationMutation
{
    /**
     * @throws Error
     * @throws \Exception
     */
    public function __invoke($_, array $args): array
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $freeText = $args['freeText'];

        $data = StrategyService::generateTitleAndDescriptionForAutomation(
            $freeText,
        );

        // extract the title and description from the data
        $title              = $data['title'];
        $description        = $data['description'];
        $prompt_description = $data['prompt_description'];

        $steps = StrategyService::extractAutomationType($description);

        Log::info('Automation Type: ' . json_encode($steps));

        return $data;
    }
}
