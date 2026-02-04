<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Background extends BaseModel
{
    protected $casts = [
        'metadata' => 'array',
    ];

    public function setFileKeyAttribute($value): void
    {
        $metadata                     = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileKey']          = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    public function setFileNameAttribute($value): void
    {
        $metadata                     = json_decode($this->attributes['metadata'] ?? '{}', true);
        $metadata['fileName']         = $value;
        $this->attributes['metadata'] = json_encode($metadata);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function getImageUrlAttribute(): string
    {
        return Storage::disk('s3')->temporaryUrl(
            $this->metadata['fileKey'],
            now()->addHour(),
        );
    }
}
