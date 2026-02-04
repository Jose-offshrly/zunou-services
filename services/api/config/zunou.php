<?php

return [
    'ai' => [
        'endpoint' => env('ZUNOU_AI_ENDPOINT'),
        'token' => env('ZUNOU_AI_TOKEN'),
    ],
    'app' => [
        'logo' => env(
            'ZUNOU_LOGO',
            'https://scout.staging.zunou.ai/icons_zunou/favicon-96x96.png'
        ),
    ],
    'aws' => [
        'key' => env('AMAZON_ACCESS_KEY_ID'),
        'secret' => env('AMAZON_SECRET_ACCESS_KEY'),
        'region' => env('AMAZON_DEFAULT_REGION'),
        'sqs_queue_url' => env('AMAZON_SQS_QUEUE_URL'),
    ],

    'companion' => [
        'recordings_url' => env(
            'ZUNOU_COMPANION_RECORDINGS_URL',
            'https://scheduler.staging.zunou.ai/recordings'
        ),
        'status_url' => env(
            'ZUNOU_COMPANION_STATUS_URL',
            'https://scheduler.staging.zunou.ai/bot-status'
        ),
        'update_speaker_label_url' => env(
            'ZUNOU_UPDATE_SPEAKER_LABEL_URL',
            'https://scheduler.staging.zunou.ai/update-speaker-labels'
        ),
        'start_meeting_url' => env('ZUNOU_COMPANION_START_MEETING_URL'),
        'stop_meeting_url' => env('ZUNOU_COMPANION_STOP_MEETING_URL'),
        'pause_meeting_url' => env('ZUNOU_COMPANION_PAUSE_MEETING_URL'),
        'resume_meeting_url' => env('ZUNOU_COMPANION_RESUME_MEETING_URL'),
        'scale_status_url' => env('ZUNOU_COMPANION_SCALE_STATUS_URL'),
        'scale_url' => env('ZUNOU_COMPANION_SCALE_URL'),
        'scale_api_key' => env('ZUNOU_COMPANION_SCALE_API_KEY'),
    ],

    'dashboard' => [
        'base_url' => env('DASHBOARD_BASE_URL'),
    ],
    'interest' => [
        'mail' => env('ZUNOU_INTEREST_EMAIL', 'signup@zunou.ai'),
    ],

    'pinecone' => [
        'api_key' => env('PINECONE_API_KEY'),
    ],

    'pulse' => [
        'base_url' => env('PULSE_BASE_URL'),
    ],
    's3' => [
        'bucket' => env('AMAZON_BUCKET'),
        'liveUploads' => env('AMAZON_LIVE_UPLOADS_BUCKET'),
    ],
    'queue' => [
        'use_sqs' => env('ZUNOU_QUEUE_USE_SQS'),
    ],

    'slack' => [
        'client_id' => env('SLACK_CLIENT_ID'),
        'client_secret' => env('SLACK_CLIENT_SECRET'),
    ],

    'pinecone' => [
        'api_key' => env('PINECONE_API_KEY'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'embedding_model' => env('OPENAI_EMBEDDING_MODEL'),
        'model' => env('OPENAI_MODEL'),
        'organization' => env('OPENAI_ORGANIZATION'),
        'model_max_limit' => 128000,
        'reasoning_model' => env('OPENAI_REASONING_MODEL'),
        'realtime_api_api_key' => env('REALTIME_API_OPENAI_KEY'),
        'realtime_api_expiration_duration' => (int) env(
            'REALTIME_API_EXPIRATION_DURATION',
            1800
        ),
    ],

    'assemblyai' => [
        'realtime_api_api_key' => env('REALTIME_API_ASSEMBLYAI_KEY'),
        'realtime_api_expiration_duration' => (int) env(
            'REALTIME_API_ASSEMBLYAI_EXPIRATION_DURATION',
            60
        ),
    ],

    'bedrock' => [
        'model' => env('AMAZON_BEDROCK_MODEL'),
    ],
];
