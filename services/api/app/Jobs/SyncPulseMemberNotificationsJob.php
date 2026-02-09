<?php

namespace App\Jobs;

use App\Models\Pulse;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncPulseMemberNotificationsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected string $pulseId;
    protected string $userId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $pulseId, string $userId)
    {
        $this->pulseId = $pulseId;
        $this->userId = $userId;
    }

    /**
     * Syncs all existing pulse notifications to the new pulse member by bulk inserting
     * notification associations with read_at timestamp. This ensures new members see
     * all historical notifications as already read.
     *
     * @return void
     * @throws \Exception If the sync operation fails
     */
    public function handle(): void
    {
        try {
            $pulse = Pulse::find($this->pulseId);
            $user = User::find($this->userId);

            if (!$pulse || !$user) {
                Log::warning('SyncPulseMemberNotificationsJob: Pulse or User not found', [
                    'pulse_id' => $this->pulseId,
                    'user_id' => $this->userId,
                ]);
                return;
            }

            // Get all notification IDs for this pulse
            $notificationIds = DB::table('notifications')
                ->where('pulse_id', $this->pulseId)
                ->pluck('id')
                ->toArray();

            if (empty($notificationIds)) {
                return;
            }

            // Bulk insert - much faster than looping syncWithoutDetaching
            $now = now();
            $syncData = [];

            foreach ($notificationIds as $notificationId) {
                $syncData[] = [
                    'notifiable_type' => User::class,
                    'notifiable_id' => $this->userId,
                    'notification_id' => $notificationId,
                    'read_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Use upsert to handle duplicate key errors more reliably than insertOrIgnore
            // insertOrIgnore can still throw exceptions in some MySQL configurations
            DB::table('notifiable_notifications')->upsert(
                $syncData,
                ['notification_id', 'notifiable_type', 'notifiable_id'],
                ['read_at', 'updated_at']
            );

            Log::debug('SyncPulseMemberNotificationsJob: Synced notifications', [
                'pulse_id' => $this->pulseId,
                'user_id' => $this->userId,
                'notification_count' => count($notificationIds),
            ]);
        } catch (\Exception $e) {
            Log::error('SyncPulseMemberNotificationsJob: Failed to sync notifications', [
                'pulse_id' => $this->pulseId,
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
