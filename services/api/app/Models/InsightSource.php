<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InsightSource extends Model
{
    protected $table = 'insight_sources';
    public $timestamps = false;

    protected $fillable = [
        'insight_id',
        'source_type',
        'source_id',
        'contribution_weight',
        'created_at',
    ];

    protected $casts = [
        'insight_id' => 'integer',
        'contribution_weight' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    /**
     * Get the insight that owns this source.
     */
    public function insight(): BelongsTo
    {
        return $this->belongsTo(LiveInsightOutbox::class, 'insight_id');
    }

    /**
     * Get the source model (polymorphic relationship).
     */
    public function source(): MorphTo
    {
        return $this->morphTo('source', 'source_type', 'source_id');
    }

    /**
     * Scope to filter by source type.
     */
    public function scopeOfType($query, string $sourceType)
    {
        return $query->where('source_type', $sourceType);
    }

    /**
     * Scope to filter by contribution weight threshold.
     */
    public function scopeWithMinContribution($query, float $minWeight = 0.1)
    {
        return $query->where('contribution_weight', '>=', $minWeight);
    }
}
