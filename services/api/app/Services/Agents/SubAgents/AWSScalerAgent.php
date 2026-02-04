<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Models\User;
use Aws\Lambda\LambdaClient;
use Illuminate\Support\Collection;

class AWSScalerAgent extends BaseSubAgent implements SubAgentInterface
{
    public function __construct($pulse)
    {
        parent::__construct($pulse);
    }

    public function getSystemPrompt(): string
    {
        return <<<EOD
You are the AWS Scaler Agent. You manage infrastructure scaling tasks by invoking a secure Lambda function that changes ECS service counts.

You can handle instructions like:
- “Scale meet-bot to 1”
- “Set uploader service to 0”
- “Bring all services up in production”

You must extract:
- ECS cluster name
- ECS service name
- Desired task count

Be clear, confirm results, and explain errors in plain language.
EOD;
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'scaleECSService',
                    'description' => 'Scales an ECS service up or down by calling a Lambda function.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'environment' => [
                                'type'        => 'string',
                                'description' => 'Target environment: development, staging, or production.',
                            ],
                            'service' => [
                                'type'        => 'string',
                                'description' => 'The ECS service name (e.g., meet-bot-production).',
                            ],
                            'desired_count' => [
                                'type'        => 'integer',
                                'description' => 'The number of tasks to run.',
                            ],
                        ],
                        'required' => [
                            'environment',
                            'service',
                            'desired_count',
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        switch ($functionName) {
            case 'scaleECSService':
                return $this->scaleService(
                    $arguments['environment']   ?? '',
                    $arguments['service']       ?? '',
                    $arguments['desired_count'] ?? 0,
                );

            default:
                return 'This scaling action is not supported.';
        }
    }

    protected function scaleService(
        string $env,
        string $service,
        int $desiredCount,
    ): string {
        try {
            $cluster = $this->resolveClusterFromEnvironment($env);

            // Try to fetch user AWS integration
            $integration = $this->user->integrations()
                ->where('type', 'aws')
                ->first();

            if (!$integration) {
                return "❌ No AWS integration found for this user.";
            }

            $apiKey    = $integration->api_key;
            $secretKey = $integration->secret_key;

            if (empty($apiKey) || empty($secretKey)) {
                return "❌ AWS credentials are missing or invalid.";
            }

            $lambda = new LambdaClient([
                'region'      => config('services.aws.region'),
                'version'     => 'latest',
                'credentials' => [
                    'key'    => $apiKey,
                    'secret' => $secretKey,
                ],
            ]);

            $result = $lambda->invoke([
                'FunctionName'   => config('services.aws.scaler_lambda'),
                'InvocationType' => 'RequestResponse',
                'Payload'        => json_encode([
                    'cluster'       => $cluster,
                    'service'       => $service,
                    'desired_count' => $desiredCount,
                ]),
            ]);

            $statusCode = $result['StatusCode'] ?? 'unknown';
            return "✅ Scaling request sent: `{$service}` to `{$desiredCount}` in `{$env}`. Status code: {$statusCode}";
        } catch (\Aws\Exception\AwsException $e) {
            return "❌ AWS SDK error: " . $e->getAwsErrorMessage();
        } catch (\Throwable $e) {
            return "❌ Unexpected error during scaling: " . $e->getMessage();
        }
    }

    protected function resolveClusterFromEnvironment(string $env): string
    {
        return match (strtolower($env)) {
            'development' => 'primary-development',
            'staging'     => 'primary-staging',
            'production'  => 'primary-production',
            default       => throw new \InvalidArgumentException(
                "Unknown environment: $env",
            ),
        };
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last    = $messages->last();
        $message = $last['content'] ?? '';
        return $this->processSystemThread(
            'awsScalerAgent',
            $message,
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }
}
