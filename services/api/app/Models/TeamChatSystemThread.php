<?php

namespace App\Models;

use App\Contracts\SystemThreadInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class TeamChatSystemThread extends Model implements SystemThreadInterface
{
    use HasFactory;

    protected $table     = 'team_chat_system_threads';
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
        'parent_thread_type',
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
        return $this->hasMany(TeamChatSystemMessage::class, 'system_thread_id');
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

    public function parentThread(): MorphTo
    {
        return $this->morphTo();
    }
}
