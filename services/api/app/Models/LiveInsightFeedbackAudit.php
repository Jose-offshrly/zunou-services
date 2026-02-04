<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveInsightFeedbackAudit extends Model
{
    protected $table = 'live_insight_feedback_audit';
    public $timestamps = false;

    protected $fillable = [
        'feedback_id',
        'outbox_id', 
        'user_id',
        'rating',
        'tags',
        'comment',
        'action',
        'created_at'
    ];

    protected $casts = [
        'feedback_id' => 'integer',
        'outbox_id' => 'integer',
        'user_id' => 'string',
        'rating' => 'integer',
        'tags' => 'array',
        'created_at' => 'datetime',
    ];
}
