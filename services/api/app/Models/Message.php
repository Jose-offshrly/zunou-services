<?php

namespace App\Models;

use App\Enums\MessageStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use League\CommonMark\CommonMarkConverter;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Message extends Model
{
    use LogsActivity;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'content',
        'organization_id',
        'role',
        'thread_id',
        'topic_id',
        'user_id',
        'tool_calls',
        'tool_call_id',
        'is_system',
        'status',
        'metadata',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'status'   => MessageStatus::class,
        'metadata' => 'array',
    ];

    protected $appends = ['is_saved'];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        static::creating(function ($model) {
            $model->id = (string) Str::orderedUuid();
        });
    }

    public function getIsSavedAttribute()
    {
        return SavedMessage::query()
            ->where('message_id', $this->id)
            ->exists();
    }

    public function getContentHtmlAttribute()
    {
        $converter = new CommonMarkConverter();

        return $converter->convertToHtml($this->attributes['content']);
    }

    public function getCreatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['created_at'])->userTimezone();
    }

    public function getUpdatedAtAttribute(): string
    {
        return Carbon::parse($this->attributes['updated_at'])->userTimezone();
    }

    public function scopeForCurrentUser(Builder $query)
    {
        return $query->where('user_id', auth()->id());
    }

    // Log prompt changes.
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['content'])
            ->logOnlyDirty();
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeWithContent($query, $content)
    {
        return $query->where('content', 'ILIKE', $content);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function savedMessages(): HasOne
    {
        return $this->hasOne(SavedMessage::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }
}
