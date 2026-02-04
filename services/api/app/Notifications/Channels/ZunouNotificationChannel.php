<?php

namespace App\Notifications\Channels;

use App\DataTransferObjects\ZunouNotificationData;
use App\Models\Notification as ZunouNotification;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;

class ZunouNotificationChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        DB::transaction(function () use ($notifiable, $notification) {
            /** @var ZunouNotificationData $data*/
            $data = $notification->toDatabase($notifiable);

            // Check if a duplicate notification already exists
            // Match on description and organization only (ignore pulse_id and kind)
            // Only check for duplicates if we have an organization_id
            // Use lockForUpdate to prevent race conditions
            if ($data->organization_id) {
                $existingNotification = ZunouNotification::where('description', $data->description)
                    ->where('organization_id', $data->organization_id)
                    ->where('status', 'pending')
                    ->lockForUpdate()
                    ->first();

                // If a duplicate exists and is pending, don't create a new one
                if ($existingNotification) {
                    return;
                }
            }

            $notif = ZunouNotification::create([
                'description'     => $data->description,
                'kind'            => $data->kind,
                'metadata'        => $data->metadata,
                'organization_id' => $data->organization_id,
                'pulse_id'        => $data->pulse_id     ?? null,
                'summary_id'      => $data->summary_id ?? null,
            ]);
        });
    }
}
