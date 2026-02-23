<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringEvent extends BaseModel
{
    protected $fillable = [
        'google_parent_id',
    ];

    public function instanceSetups(): HasMany
    {
        return $this->hasMany(RecurringEventInstanceSetup::class);
    }
}
