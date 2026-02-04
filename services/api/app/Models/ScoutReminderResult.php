<?php

namespace App\Models;

use App\Concerns\BelongsToOrganization;
use App\Concerns\BelongsToPulse;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoutReminderResult extends BaseModel
{
    use BelongsToOrganization;
    use BelongsToPulse;
    use HasFactory;

    protected $casts = [
        'generated_at' => 'datetime',
        'event_ids'    => 'array',
    ];

    /**
     * Get the user that owns the scout reminder result.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include results for a specific user.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to only include completed results.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include processing results.
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    /**
     * Scope a query to only include failed results.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Check if the result is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the result is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if the result has failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Mark the result as completed.
     */
    public function markAsCompleted(string $result): void
    {
        $this->update([
            'status'        => 'completed',
            'result'        => $result,
            'generated_at'  => now(),
            'error_message' => null,
        ]);
    }

    /**
     * Mark the result as failed.
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status'        => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
