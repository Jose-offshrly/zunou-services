<?php

namespace App\Services;

use App\Helpers\AiUtilityHelper;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    protected static $pulse;

    public function __construct($pulse)
    {
        self::$pulse = $pulse;
    }

    public static function getClient()
    {
        return \OpenAI::client(config('zunou.openai.api_key'));
    }

    public static function createCompletion(array $openAIRequestBody)
    {
        $openAI        = self::getClient();
        $maxRetries    = 3;
        $attempt       = 0;
        $lastException = null;
        while ($attempt < $maxRetries) {
            try {
                $attempt++;
                return $openAI->chat()->create($openAIRequestBody);
            } catch (\OpenAI\Exceptions\ErrorException $e) {
                $lastException = $e;
                Log::debug("Attempt {$attempt}: " . $e->getMessage());

                if ($e->getStatusCode() === 400) {
                    $openAIRequestBody[
                        'messages'
                    ] = AiUtilityHelper::reorderMessages(
                        $openAIRequestBody['messages'],
                    );
                } else {
                    throw $e;
                }
            } catch (\Exception $e) {
                throw $e;
            }
        }

        throw $lastException ?? new \Exception(
                'Max retry attempts reached, but no exception was captured.',
            );
    }

    public static function createChatCompletion(
        array $userMessages,
        array $options = [],
    ) {
        $openAI       = self::getClient();
        $pulseContext = self::retrievePulseContext();
        $model        = isset($options['model'])
            ? $options['model']
            : config('zunou.openai.model');
        if (isset($options['model'])) {
            unset($options['model']);
        }
        $openAIRequestBody = array_merge(
            [
                'model'    => $model,
                'messages' => array_merge($pulseContext, $userMessages),
            ],
            $options,
        );
        Log::debug('[OPENAISERVICE] createChatCompletion', $openAIRequestBody);
        return $openAI->chat()->create($openAIRequestBody);
    }

    public static function retrievePulseContext()
    {
        $pulseInformation = self::$pulse->getPulseInformation();
        $systemPrompt     = "You are inside the pulse. The pulse has missions that talks about the pulse's purpose or objective. Your goal is to help the user achieve this mission. Here is the information about this pulse: $pulseInformation";
        $pulseContext     = [
            'role'    => 'system',
            'content' => $systemPrompt,
        ];
        return [$pulseContext];
    }
}
