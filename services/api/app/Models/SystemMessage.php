<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemMessage extends Model
{
    use HasFactory;

    protected $table = 'system_messages';

    protected $fillable = [
        'id',
        'system_thread_id',
        'role',
        'content',
        'tool_calls',
        'tool_call_id',
        'is_system',
        'metadata',
        'topic_id',
    ];

    /**
     * Relationship to the SystemThread model.
     * Each SystemMessage belongs to a single SystemThread.
     *
     * @return BelongsTo
     */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(SystemThread::class, 'system_thread_id');
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }
}
