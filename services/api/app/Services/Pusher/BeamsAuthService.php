<?php

namespace App\Services\Pusher;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BeamsAuthService
{
    public function __construct(private readonly BeamsService $beamsService)
    {
    }

    /**
     * Validate request context and generate Beams token for the given user.
     *
     * @param  Authenticatable|null  $user
     * @return array                 The Beams token payload
     *
     * @throws HttpException         If validation fails or service unavailable
     */
    public function authenticateAndGenerateToken(?Authenticatable $user): array
    {
        if (! $user) {
            throw new HttpException(401, 'Unauthorized');
        }

        if (! $this->beamsService->isEnabled()) {
            Log::error('Beams auth: Beams service is not enabled or configured');
            throw new HttpException(503, 'Beams service not available');
        }

        $beamsClient = $this->beamsService->getClient();
        return $beamsClient->generateToken((string) $user->id);
    }
}
