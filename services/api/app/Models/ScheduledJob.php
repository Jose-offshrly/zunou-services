<?php

namespace App\Models;

use App\Enums\AutomationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ScheduledJob extends Model
{
    protected $fillable = [
        'type',
        'job_class',
        'payload',
        'on_queue',
        'next_run_at',
    ];

    public $incrementing = false;
    protected $keyType   = 'string';

    protected $casts = [
        'type' => AutomationType::class,
        'payload' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
