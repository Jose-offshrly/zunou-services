<?php

namespace App\Actions\Pulse;

use App\Models\Pulse;

class DeletePulseAction
{
    public function handle(Pulse $pulse): bool
    {
        return $pulse->delete();
    }
}
