<?php

namespace App\Models;

use App\Enums\WeekendDisplay;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Setting extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'organization_id',
        'theme',
        'color',
        'metadata',
        'mode',
        'weekend_display',
    ];

    protected $casts = [
        'metadata' => 'array',
        'weekend_display' => WeekendDisplay::class,
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

    public function setFileKeyAttribute($value): void
    {
        $metadata = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileKey'] = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    public function setFileNameAttribute($value): void
    {
        $metadata = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileName'] = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }
}
