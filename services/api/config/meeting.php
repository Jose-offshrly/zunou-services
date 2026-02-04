<?php

return [
    'drivers' => [
        'manual' => [
            'creator'      => App\Actions\Meeting\CreateMeetingAction::class,
            'storage_path' => 'manual',
        ],
        'google-meet' => [
            'creator'      => null,
            'storage_path' => 'google_meet',
        ],
        'companion' => [
            'creator'      => App\Actions\Meeting\CreateMeetingAction::class,
            'storage_path' => 'companion',
        ],
    ],
];
