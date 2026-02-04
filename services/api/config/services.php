<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */
    'auth0' => [
        'domain'             => env('AUTH0_DOMAIN'),
        'mgmt_client_id'     => env('AUTH0_MGMT_CLIENT_ID'),
        'mgmt_client_secret' => env('AUTH0_MGMT_CLIENT_SECRET'),
    ],

    'aws' => [
        'region'        => env('AWS_DEFAULT_REGION', 'ap-northeast-1'),
        'scaler_lambda' => env(
            'AWS_SCALER_LAMBDA',
            'ecs-service-scaler-production',
        ),
    ],

    'mailgun' => [
        'domain'   => env('MAILGUN_DOMAIN'),
        'secret'   => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme'   => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AMAZON_ACCESS_KEY_ID'),
        'secret' => env('AMAZON_SECRET_ACCESS_KEY'),
        'region' => env('AMAZON_DEFAULT_REGION', 'ap-northeast-1'),
    ],

    'slack' => [
        'token' => env('SLACK_BOT_TOKEN'),
    ],

    'stripe' => [
        'secret'         => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];
