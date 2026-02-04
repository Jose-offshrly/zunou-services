<?php

use App\Models\Notification;
use App\Models\PulseMember;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the current timestamp
        $now = Carbon::now();

        // Loop through all pulse members
        foreach (PulseMember::with('pulse', 'user')->get() as $pulseMember) {
            $pulse = $pulseMember->pulse;
            $user  = $pulseMember->user;

            if (! $pulse || ! $user) {
                continue; // Skip if missing relation
            }

            // Get all notification IDs for this pulse
            $notificationIds = $pulse->notifications()->pluck('id')->toArray();

            if (empty($notificationIds)) {
                continue;
            }

            // Get notification IDs the user already has
            $existing = DB::table('notification_user')
                ->where('user_id', $user->id)
                ->whereIn('notification_id', $notificationIds)
                ->pluck('notification_id')
                ->toArray();

            // Find notifications the user is missing
            $missing = array_diff($notificationIds, $existing);

            // Attach missing notifications as read
            foreach ($missing as $notificationId) {
                DB::table('notification_user')->insert([
                    'notification_id' => $notificationId,
                    'user_id'         => $user->id,
                    'read_at'         => $now,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ]);
            }
        }
    }
};
