<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MonthlyTimeSaved extends Model
{
    public $incrementing = false; // UUID primary key
    protected $keyType   = 'string'; // UUID primary key type
    protected $table     = 'monthly_time_saved';

    protected $fillable = [
        'organization_id',
        'pulse_id',
        'time_saved',
        'month',
        'year',
    ];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::orderedUuid();
        });
    }

    /**
     * Relationship to organization.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
