<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use Aws\S3\S3Client;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Config;

class File extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;
    use HasFactory;
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($file) {
            if (empty($file->size) && ! empty($file->path)) {
                $file->size = $file->getFileSizeFromS3();
            }
        });
    }

    /**
     * Get the owning entity (polymorphic relationship).
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function data_source(): BelongsTo
    {
        return $this->belongsTo(DataSource::class, 'data_source_id');
    }

    /**
     * Get the file size from S3
     */
    public function getFileSizeFromS3(): ?int
    {
        try {
            $s3Client = new S3Client([
                'version'     => 'latest',
                'region'      => Config::get('zunou.aws.region'),
                'credentials' => [
                    'key'    => Config::get('zunou.aws.key'),
                    'secret' => Config::get('zunou.aws.secret'),
                ],
            ]);

            $result = $s3Client->headObject([
                'Bucket' => Config::get('zunou.s3.bucket'),
                'Key'    => $this->path,
            ]);

            return $result['ContentLength'] ?? null;
        } catch (\Exception $e) {
            // Log the error for debugging but don't break the application
            \Log::error(
                'Error getting file size from S3: ' . $e->getMessage(),
                [
                    'file_id' => $this->id,
                    'path'    => $this->path,
                ],
            );
            return null;
        }
    }

    public function getUrlAttribute(): string
    {
        try {
            $key = $this->path;

            $s3Client = new S3Client([
                'version'     => 'latest',
                'region'      => Config::get('zunou.aws.region'),
                'credentials' => [
                    'key'    => Config::get('zunou.aws.key'),
                    'secret' => Config::get('zunou.aws.secret'),
                ],
            ]);

            $cmd = $s3Client->getCommand('GetObject', [
                'Bucket' => Config::get('zunou.s3.bucket'),
                'Key'    => $key,
                'ACL'    => 'private',
            ]);

            $request = $s3Client->createPresignedRequest($cmd, '+30 minutes');
            $url     = (string) $request->getUri();

            return $url;
        } catch (\Exception $e) {
            // Log the error for debugging but don't break the application
            \Log::error('Error generating file URL: ' . $e->getMessage(), [
                'file_id'        => $this->id,
                'data_source_id' => $this->data_source_id,
            ]);
            return '';
        }
    }
}
