<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Organization;
use App\Models\Pulse;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pulse        = Pulse::first();
        $organization = Organization::first();

        // Pulse Notifications
        $pulseNotifications = [
            'Working hours survey results are in. Check results.',
            'A lot of people are asking about christmas leaves.',
            'Some people have issues with their equipment',
        ];

        foreach ($pulseNotifications as $key => $value) {
            $pulseNotification = Notification::create([
                'description' => $value,
                'status'      => 'pending',
            ]);

            $pulseNotification->pulses()->attach($pulse->id);
        }

        // Organization Notifications
        $orgNotifications = [
            'There maybe questions about overtime.',
            'New Product development meeting notes added.',
            'A lot of people are asking about christmas leaves.',
        ];

        foreach ($orgNotifications as $key => $value) {
            $orgNotification = Notification::create([
                'description' => $value,
                'status'      => 'pending',
            ]);

            $orgNotification->organizations()->attach($organization->id);
        }
    }
}
