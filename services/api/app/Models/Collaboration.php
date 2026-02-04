<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use App\Concerns\BelongsToUser;
use App\Contracts\Participable;
use App\Enums\CollaborationStatus;
use Illuminate\Database\Eloquent\SoftDeletes;

class Collaboration extends BaseModel implements Participable
{
    use \App\Concerns\Participable;
    use BelongsToOrganization;
    use BelongsToPulse;
    use BelongsToUser;
    use SoftDeletes;

    protected $casts = [
        'status'   => CollaborationStatus::class,
        'start_at' => 'datetime',
        'end_at'   => 'datetime',
    ];
}
