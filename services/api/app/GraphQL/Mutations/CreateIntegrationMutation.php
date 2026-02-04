<?php

namespace App\GraphQL\Mutations;

use App\Actions\FireFlies\FetchUserFireFliesDetailAction;
use App\DataTransferObjects\IntegrationData;
use App\Models\Integration;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

class CreateIntegrationMutation
{
    public function __construct(
        private readonly FetchUserFireFliesDetailAction $fetchUserFireFliesDetailAction,
    ) {
    }

    /**
     * @throws Error
     */
    public function __invoke($_, array $args): Integration
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $type = $args['type'];

        $data = new IntegrationData(
            user_id: $user->id,
            pulse_id: $args['pulse_id'],
            type: $args['type'],
            api_key: $args['api_key'],
            secret_key: $args['secret_key'] ?? null,
        );

        switch ($type) {
            case 'aws':
                return Integration::updateOrCreate(
                    [
                        'user_id'  => $user->id,
                        'pulse_id' => $data->pulse_id,
                        'type'     => 'aws',
                    ],
                    [
                        'api_key'    => $data->api_key,
                        'secret_key' => $data->secret_key,
                    ],
                )->refresh();

            case 'fireflies':
                $this->fetchUserFireFliesDetailAction->handle(
                    $data->api_key,
                    $user,
                );
                $action = app(
                    \App\Actions\FireFlies\ProcessFireFliesTranscriptAction::class,
                );
                Log::info('Processing fireflies transcripts');
                return $action->handle($data)->refresh();

            case 'github':
                return Integration::updateOrCreate(
                    [
                        'user_id'  => $user->id,
                        'pulse_id' => $data->pulse_id,
                        'type'     => $data->type,
                    ],
                    [
                        'api_key' => $data->api_key,
                    ],
                )->refresh();

            default:
                throw new Error("Unsupported integration type: {$type}");
        }
    }
}
