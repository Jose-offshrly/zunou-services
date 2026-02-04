<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NotificationContext extends Model
{
    public $incrementing = false;
    protected $keyType   = 'string';
    protected $table     = 'notification_context';
    protected $fillable  = ['notification_id', 'summary_id', 'task_id'];

    protected static function boot(): void
    {
        parent::boot();

        // Generate a UUID when creating a new model instance
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function notification()
    {
        return $this->belongsTo(Notification::class, 'notification_id');
    }

    public function summary()
    {
        return $this->belongsTo(Summary::class, 'summary_id');
    }

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }
}
