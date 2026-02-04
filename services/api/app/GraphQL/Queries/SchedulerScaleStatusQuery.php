<?php

namespace App\GraphQL\Queries;

use App\Services\SchedulerScaleService;
use Illuminate\Support\Facades\Log;

class SchedulerScaleStatusQuery
{
    public function __construct(
        protected SchedulerScaleService $service,
    ) {
    }

    public function __invoke($_, array $args): array
    {
        $data = $this->service->getStatus();

        if (! ($data['success'] ?? false)) {
            Log::warning('schedulerScaleStatus: non-success response', $data);
            return [
                'running'      => 0,
                'active'       => 0,
                'pending'      => 0,
                'maxInstances' => 0,
            ];
        }

        return [
            'running'      => (int) ($data['ecs']['running'] ?? 0),
            'active'       => (int) ($data['meetings']['active'] ?? 0),
            'pending'      => (int) ($data['ecs']['pending'] ?? 0),
            'maxInstances' => (int) ($data['capacity']['maxInstances'] ?? 0),
        ];
    }
}


