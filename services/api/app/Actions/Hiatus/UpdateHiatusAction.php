<?php

namespace App\Actions\Hiatus;

use App\Models\Hiatus;

final readonly class UpdateHiatusAction
{
    public function __construct(
        private CalculateHiatusTotalTimeAction $calculateHiatusTotalTimeAction,
    ) {
    }

    public function handle(Hiatus $hiatus): Hiatus
    {
        $end   = now();
        $total = $this->calculateHiatusTotalTimeAction->handle($hiatus, $end);

        $hiatus->update([
            'end_at' => $end,
            'total'  => $total,
        ]);

        return $hiatus->refresh();
    }
}
