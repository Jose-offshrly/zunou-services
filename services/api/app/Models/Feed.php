<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feed extends BaseModel
{
    protected $table = 'activity_logs';

    // If needed:
    protected $guarded = [];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
