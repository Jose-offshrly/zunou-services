<?php

namespace App\Helpers;

class AiUtilityHelper
{
    public static function reorderMessages(array $messages)
    {
        $toolMessages = [];
        $reordered    = [];

        foreach ($messages as $key => $message) {
            if (
                $message['role'] === 'tool' && ! empty($message['tool_call_id'])
            ) {
                $toolMessages[$message['tool_call_id']] = $message;
                unset($messages[$key]);
            }
        }

        $messages = array_values($messages);

        foreach ($messages as $message) {
            $reordered[] = $message;

            if (
                isset($message['tool_calls']) && ! is_null($message['tool_calls'])
            ) {
                // $decodedToolCalls = json_decode($message['tool_calls'], true);
                foreach ($message['tool_calls'] as $toolCall) {
                    if (isset($toolMessages[$toolCall['id']])) {
                        $reordered[] = $toolMessages[$toolCall['id']];
                        unset($toolMessages[$toolCall['id']]);
                    }
                }
            }
        }

        return $reordered;
    }
}
