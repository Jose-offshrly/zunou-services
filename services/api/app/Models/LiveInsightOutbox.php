<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class LiveInsightOutbox extends Model
{
    protected $table = 'live_insight_outbox';

    public $timestamps = false;

    protected $fillable = [
        'item_hash',
        'meeting_id',
        'pulse_id',
        'type',
        'topic',
        'description',
        'explanation',
        'user_id',
        'delivery_status',
        'delivered_at',
        'read_at',
        'closed_at',
        'closed_reason',
        'is_bookmarked',
        'bookmarked_at',
        'remind_at',
        'snooze_count',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'meeting_id' => 'string',
        'pulse_id' => 'string',
        'user_id' => 'string',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
        'closed_at' => 'datetime',
        'is_bookmarked' => 'boolean',
        'bookmarked_at' => 'datetime',
        'remind_at' => 'datetime',
        'snooze_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class, 'pulse_id');
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function feedback(): HasOne
    {
        return $this->hasOne(LiveInsightFeedback::class, 'outbox_id');
    }

    public function sources(): HasMany
    {
        return $this->hasMany(InsightSource::class, 'insight_id');
    }

    public function recommendations()
    {
        return $this->belongsToMany(
            LiveInsightRecommendation::class,
            'live_insight_outbox_recommendation',
            'live_insight_outbox_id',
            'live_insight_recommendation_id'
        )
            ->withPivot('user_id')
            ->withTimestamps();
    }

    public function topicThread()
    {
        return $this->morphOne(Topic::class, 'reference');
    }

    /**
     * Get sources by type (e.g., 'meeting', 'note', 'task').
     */
    public function sourcesOfType(string $sourceType): HasMany
    {
        return $this->sources()->where('source_type', $sourceType);
    }

    /**
     * Get primary source (highest contribution weight).
     */
    public function primarySource(): HasMany
    {
        return $this->sources()
            ->orderBy('contribution_weight', 'desc')
            ->limit(1);
    }

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Used by GraphQL @builder on myLiveInsights
     * Always scopes to the authenticated user and defaults to "open" items.
     */
    public function scopeInboxForMe(Builder $q, $args = null): Builder
    {
        // Lighthouse may pass null; normalize
        $args = is_array($args) ? $args : [];

        $userId = auth()->id();
        $q->where('user_id', $userId);

        // Optional org fence via Pulse relation
        $orgId = $args['organizationId'] ?? ($args['organization_id'] ?? null);
        if ($orgId) {
            $q->whereHas('pulse', function (Builder $qq) use ($orgId) {
                $qq->where('organization_id', $orgId);
            });
        }

        // Filters from GraphQL
        $filter = $args['filter'] ?? [];

        // Default to "open" unless status explicitly provided
        if (!empty($filter['status'])) {
            $q->where('delivery_status', $filter['status']);
        } else {
            $q->whereIn('delivery_status', ['pending', 'delivered']);
        }

        if (!empty($filter['type'])) {
            $q->where('type', $filter['type']);
        }

        if (!empty($filter['since'])) {
            $q->where('updated_at', '>=', $filter['since']);
        }

        if (!empty($filter['search'])) {
            $s = trim((string) $filter['search']);
            $q->where(function (Builder $qq) use ($s) {
                $qq->where('topic', 'ilike', "%{$s}%")
                    ->orWhere('description', 'ilike', "%{$s}%")
                    ->orWhere('explanation', 'ilike', "%{$s}%");
            });
        }

        if (isset($filter['bookmarked'])) {
            if ($filter['bookmarked']) {
                $q->where('is_bookmarked', true);
            } else {
                $q->where('is_bookmarked', false);
            }
        }

        return $q;
    }

    // (Optional) keep for backward compat; already nullable-safe.
    public function scopeSearchFilter(Builder $q, ?array $args = null): Builder
    {
        $filter = $args['filter'] ?? null;
        if (!$filter) {
            return $q;
        }

        if (!empty($filter['since'])) {
            $q->where('updated_at', '>=', $filter['since']);
        }
        if (!empty($filter['search'])) {
            $s = trim((string) $filter['search']);
            $q->where(function (Builder $qq) use ($s) {
                $qq->where('topic', 'ilike', "%{$s}%")
                    ->orWhere('description', 'ilike', "%{$s}%")
                    ->orWhere('explanation', 'ilike', "%{$s}%");
            });
        }

        return $q;
    }

    public function getCreatedAtAttribute(): ?string
    {
        if (isset($this->attributes['created_at'])) {
            return Carbon::parse(
                $this->attributes['created_at']
            )->userTimezone();
        }

        return null;
    }

    public function getUpdatedAtAttribute(): ?string
    {
        if (isset($this->attributes['updated_at'])) {
            return Carbon::parse(
                $this->attributes['updated_at']
            )->userTimezone();
        }

        return null;
    }

    public function getDeliveredAtAttribute(): ?string
    {
        if (isset($this->attributes['delivered_at'])) {
            return Carbon::parse(
                $this->attributes['delivered_at']
            )->userTimezone();
        }

        return null;
    }

    public function getReadAtAttribute(): ?string
    {
        if (isset($this->attributes['read_at'])) {
            return Carbon::parse($this->attributes['read_at'])->userTimezone();
        }

        return null;
    }

    public function getClosedAtAttribute(): ?string
    {
        if (isset($this->attributes['closed_at'])) {
            return Carbon::parse(
                $this->attributes['closed_at']
            )->userTimezone();
        }

        return null;
    }

    public function getBookmarkedAtAttribute(): ?string
    {
        if (isset($this->attributes['bookmarked_at'])) {
            return Carbon::parse(
                $this->attributes['bookmarked_at']
            )->userTimezone();
        }

        return null;
    }

    public function getRemindAtAttribute(): ?string
    {
        if (isset($this->attributes['remind_at'])) {
            return Carbon::parse(
                $this->attributes['remind_at']
            )->userTimezone();
        }

        return null;
    }
}
