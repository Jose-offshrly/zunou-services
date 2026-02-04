<?php

return [
    'api_url' => env('FIRE_FLIES_API_URL', 'https://api.fireflies.ai/graphql'),

    'test' => [
        'user_email' => env('FIRE_FLIES_TEST_USER_EMAIL', null),

        'user_name' => env('FIRE_FLIES_TEST_USER_NAME', null),

        'api_key' => env('FIRE_FLIES_TEST_API_KEY', null),

        'ff_user_id' => env('FIRE_FLIES_TEST_USER_ID', null),
    ],
];
