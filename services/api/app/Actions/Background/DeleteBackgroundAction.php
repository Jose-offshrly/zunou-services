<?php

declare(strict_types=1);

namespace App\Actions\Background;

use App\Models\Background;

class DeleteBackgroundAction
{
    public function handle(Background $background): bool
    {
        return $background->delete();
    }
}
