<?php

namespace App\Models;

use App\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Assignee extends BaseModel
{
    use BelongsToUser;

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }
}
