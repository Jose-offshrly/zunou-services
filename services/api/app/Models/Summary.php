<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Summary extends Model
{
    use HasFactory;

    protected $table     = 'summaries';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'summary',
        'name',
        'pulse_id',
        'user_id',
        'data_source_id',
        'date',
        'attendees',
        'potential_strategies',
        'action_items',
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

    public function getAttendeesAsArrayAttribute()
    {
        return explode(',', $this->attendees);
    }

    public function getPotentialStrategiesAsArrayAttribute()
    {
        return json_decode($this->potential_strategies) ?? [];
    }

    public function getActionItemsAsArrayAttribute()
    {
        $actionItems = json_decode($this->action_items, true) ?? [];

        return array_map(function ($item) {
            if (empty($item['due_date'])) {
                $item['due_date'] = null; // Convert empty string or missing to null
            }
            return $item;
        }, $actionItems);
    }

    public function getDateAttribute(): string
    {
        return Carbon::parse($this->attributes['date'], 'UTC')->userTimezone();
    }
}
