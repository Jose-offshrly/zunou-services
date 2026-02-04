<?php

namespace App\GraphQL\Mutations;

use App\Actions\Feed\CreateFeedAction;
use App\DataTransferObjects\FeedData;
use App\Models\Feed;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Validator;

readonly class CreateFeedMutation
{
    public function __construct(private CreateFeedAction $createFeedAction)
    {
    }

    public function __invoke($_, array $args): Feed
    {
        try {
            $this->validateInput($args['input']);

            return $this->createFeed($args['input']);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a pulse feed: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input)
    {
        $validator = Validator::make($input, [
            'content' => 'required',
            'userId'  => 'required|exists:users,id',
            'pulseId' => 'required|exists:pulses,id',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function createFeed(array $input): Feed
    {
        $data = new FeedData(
            content: 'Crafting innovative campaigns',
            user_id: $input['userId'],
            pulse_id: $input['pulseId'],
            organization_id: $input['organizationId'],
        );

        return $this->createFeedAction->handle($data);
    }
}
