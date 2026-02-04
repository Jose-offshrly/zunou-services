<?php

return [
    // Whether Beams is enabled. Allows easy toggling per environment.
    'enabled' => env('PUSHER_BEAMS_ENABLED', true),

    // Pusher Beams instance credentials
    'instance_id' => env('PUSHER_BEAMS_INSTANCE_ID'),
    'secret_key'  => env('PUSHER_BEAMS_SECRET_KEY'),

    // Optional interest prefix to avoid cross-environment collisions
    'interest_prefix' => env('PUSHER_BEAMS_INTEREST_PREFIX', ''),
];


