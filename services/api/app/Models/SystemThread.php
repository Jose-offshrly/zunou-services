<?php

namespace App\Models;

use App\Contracts\SystemThreadInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SystemThread extends Model implements SystemThreadInterface
{
    use HasFactory;

    protected $table     = 'system_threads';
    public $incrementing = false;
    protected $keyType   = 'uuid';

    protected $fillable = [
        'id',
        'task_type',
        'status',
        'organization_id',
        'user_id',
        'pulse_id',
        'parent_thread_id',
        'data_source_id',
        'previous_context',
    ];

    /**
     * Relationship to the SystemMessage model.
     * Each SystemThread can have many SystemMessages.
     *
     * @return HasMany
     */
    public function messages(): HasMany
    {
        return $this->hasMany(SystemMessage::class, 'system_thread_id');
    }

    /**
     * Boot method to assign a UUID to the 'id' field upon creation.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
