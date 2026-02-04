<?php

namespace App\Models;

use App\Enums\DataSourceOrigin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Parental\HasChildren;

class DataSource extends BaseModel
{
    // We use Parental single-table-inheritance to define child models.
    use HasChildren;
    use SoftDeletes;

    protected $fillable = [
        'id',
        'description',
        'name',
        'organization_id',
        'metadata',
        'type',
        'status',
        'pulse_id',
        'origin',
        'is_viewable',
        'token_count',
        'created_by',
        'keyterms',
    ];

    protected $casts = [
        'metadata' => 'array',
        'keyterms' => 'array',
        'origin' => DataSourceOrigin::class,
        'is_viewable' => 'boolean',
    ];

    /**
     * Generate UUID as string (not object) so observers can pass it to
     * CacheService::clearLighthouseCache() which expects string|int.
     */
    public static function booted()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::orderedUuid();
            }
        });
    }

    public function scopeForPulse(Builder $query, string $pulseId): Builder
    {
        return $query->where('pulse_id', $pulseId);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function systemThread(): BelongsTo
    {
        return $this->belongsTo(SystemThread::class, 'previous_context_id');
    }

    public function setFileKeyAttribute($value)
    {
        // TODO: handle the case where we may have metadata with other
        // fields. We should merge instead of over-write
        $metadata = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileKey'] = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    public function getFileKeyAttribute()
    {
        $metadata = json_decode($this->attributes['metadata'] ?? '{}', true);

        return $metadata['fileKey'] ?? null;
    }

    public function setFilenameAttribute($value)
    {
        // TODO: if metadata is already set, we should merge instead of over-write
        $metadata = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['filename'] = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    // // TODO: do we need these?
    protected $childTypes = [
        'csv' => CsvDataSource::class,
        'doc' => DocDataSource::class,
        'docx' => DocxDataSource::class,
        'html' => HtmlDataSource::class,
        'markdown' => MarkdownDataSource::class,
        'ppt' => PptDataSource::class,
        'pptx' => PptxDataSource::class,
        'text' => TextDataSource::class,
        'manual' => ManualDataSource::class,
        'rtf' => RtfDataSource::class,
        'pdf' => PdfDataSource::class,
        'xls' => XlsDataSource::class,
        'xlsx' => XlsxDataSource::class,
        'mp4' => MP4DataSource::class,
        'jpeg' => JpegDataSource::class,
        'png' => PngDataSource::class,
    ];

    public function pulse(): BelongsTo
    {
        return $this->belongsTo(Pulse::class, 'pulse_id');
    }

    public function scopeForCurrentUser(Builder $query)
    {
        return $query->whereHas('pulse', function ($query) {
            $query->whereHas('members', function ($query) {
                $query->where('pulse_members.user_id', auth()->id());
            });
        });
    }

    public function scopeOrigin($query, $origin)
    {
        return $query->where('origin', strtolower($origin));
    }

    public function scopeWithMeetingSession(Builder $query): Builder
    {
        return $query->with('meeting.meetingSession');
    }

    public function summaries(): HasMany
    {
        return $this->hasMany(Summary::class);
    }

    public function meeting(): HasOne
    {
        return $this->hasOne(Meeting::class);
    }

    public function transcript(): HasOne
    {
        return $this->hasOne(Transcript::class);
    }

    public function getUpdatedAtAttribute(): string
    {
        return Carbon::parse(
            $this->attributes['updated_at'],
            'UTC'
        )->userTimezone();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get action items from all summaries associated with this data source.
     *
     * @return array
     */
    public function getActionItemsAttribute(): array
    {
        $actionItems = [];

        foreach ($this->summaries as $summary) {
            $summaryActionItems = $summary->getActionItemsAsArrayAttribute();
            if (!empty($summaryActionItems)) {
                $actionItems = array_merge($actionItems, $summaryActionItems);
            }
        }

        return $actionItems;
    }
}
