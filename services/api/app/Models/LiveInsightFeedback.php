<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveInsightFeedback extends Model
{
    protected $table = 'live_insight_feedback';

    public $timestamps = false;

    protected $fillable = ['outbox_id', 'user_id', 'rating', 'tags', 'comment', 'created_at'];

    protected $casts = [
        'outbox_id'  => 'integer',
        'user_id'    => 'string',
        'rating'     => 'integer',
        'tags'       => 'array',
        'created_at' => 'datetime',
    ];
}
