<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Enums\AiAgentType;
use App\Models\AiAgent;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

final readonly class CreateAiAgentMutation
{
    public function __invoke($_, array $args): AiAgent
    {
        $credentials = $args['credentials'];

        // $this->validateCredentials($args['agent_type'], $credentials);

        return AiAgent::create([
            'pulse_id'        => $args['pulse_id'],
            'organization_id' => $args['organization_id'],
            'name'            => $args['name'],
            'description'     => $args['description'],
            'icon'            => $args['icon']             ?? null,
            'guidelines'      => $args['guidelines'] ?? null,
            'agent_type'      => $args['agent_type'],
            'credentials'     => $credentials,
        ]);
    }

    public function validateCredentials(
        string $agentType,
        string|array $credentials,
    ): void {
        match ($agentType) {
            AiAgentType::GITHUB->value => Validator::make($credentials, [
                'key'       => ['required', 'string'],
                'workspace' => ['required', 'string'],
            ])->validate(),
            // TODO: Add validation rules for other agent types
            AiAgentType::SLACK->value => Validator::make(
                $credentials,
                [],
            )->validate(),
            AiAgentType::JIRA->value => Validator::make($credentials, [
                'key'       => ['required', 'string'],
                'projectId' => ['required', 'string'],
            ])->validate(),

            default => throw new InvalidArgumentException(
                "Unsupported agent type: {$agentType}",
            ),
        };
    }
}
