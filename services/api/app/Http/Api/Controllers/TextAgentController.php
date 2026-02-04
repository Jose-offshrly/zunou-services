<?php

declare(strict_types=1);

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\TextAgentRequest;
use App\Services\TextAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TextAgentController
{
    public function __construct(
        private readonly TextAgentService $textAgentService
    ) {}

    /**
     * Handle a text completion request from OpenAI.
     * 
     * Supports both streaming (SSE) and non-streaming (JSON) responses
     * based on the `stream` parameter in the request.
     */
    public function completion(TextAgentRequest $request): StreamedResponse|JsonResponse
    {
        $user = Auth::user();
        $params = $request->validated();
        $shouldStream = $params['stream'] ?? true;

        if ($shouldStream) {
            return $this->streamingResponse($user, $params);
        }

        return $this->nonStreamingResponse($user, $params);
    }

    /**
     * Return a streaming SSE response.
     */
    private function streamingResponse($user, array $params): StreamedResponse
    {
        return new StreamedResponse(function () use ($user, $params) {
            // Disable output buffering for real-time streaming
            if (ob_get_level()) {
                ob_end_clean();
            }

            // Callback to emit SSE events
            $emitEvent = function (array $event) {
                $type = $event['type'] ?? 'message';
                
                echo "event: {$type}\n";
                echo 'data: ' . json_encode($event) . "\n\n";

                // Flush immediately to send to client
                if (ob_get_level()) {
                    ob_flush();
                }
                flush();
            };

            // Stream the completion
            $this->textAgentService->streamCompletion($user, $params, $emitEvent);

            // Send done event
            echo "event: done\n";
            echo "data: [DONE]\n\n";
            flush();

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disable Nginx buffering
        ]);
    }

    /**
     * Return a non-streaming JSON response.
     */
    private function nonStreamingResponse($user, array $params): JsonResponse
    {
        $result = $this->textAgentService->completion($user, $params);

        if (isset($result['error'])) {
            $statusCode = $result['status'] ?? 500;
            return response()->json([
                'errors' => [['message' => $result['error']]]
            ], $statusCode);
        }

        return response()->json($result);
    }
}
