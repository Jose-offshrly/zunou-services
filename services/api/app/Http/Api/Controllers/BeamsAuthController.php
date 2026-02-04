<?php

namespace App\Http\Api\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Pusher\BeamsAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BeamsAuthController extends Controller
{
    public function __construct(
        private readonly BeamsAuthService $beamsAuthService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            $token = $this->beamsAuthService->authenticateAndGenerateToken($user);

            Log::info('Beams auth: Token generated successfully', [
                'user_id' => $user?->id,
            ]);

            return response()->json($token);

        } catch (HttpException $e) {
            return response()->json(['error' => $e->getMessage()], $e->getStatusCode());
        } catch (\Exception $e) {
            Log::error('Beams auth error', [
                'error'   => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
