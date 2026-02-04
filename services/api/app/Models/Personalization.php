<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Personalization extends Model
{
    protected $fillable = [
        'id',
        'user_id',
        'summary',
        'type',
        'keywords',
        'processed_at',
    ];

    public $incrementing = false;
    protected $keyType   = 'string';

    protected static function boot()
    {
        parent::boot();

        // Generate a UUID when creating a new model instance
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
