<?php

return [
    'default_auth_profile' => env('GOOGLE_CALENDAR_AUTH_PROFILE', 'oauth'),

    'auth_profiles' => [
        /*
         * Authenticate using a service account.
         */
        'service_account' => [
            /*
             * Path to the json file containing the credentials.
             */
            'credentials_json' => storage_path(
                'app/google-calendar/service-account-credentials.json',
            ),
        ],

        /*
         * Authenticate with actual google user account.
         */
        'oauth' => [
            /*
             * Client ID from Google Cloud Console
             */
            'client_id' => env('GOOGLE_CLIENT_ID'),

            /*
             * Client Secret from Google Cloud Console
             */
            'client_secret' => env('GOOGLE_CLIENT_SECRET'),

            /*
             * Path to the json file containing the credentials.
             */
            'credentials_json' => storage_path(
                env('GOOGLE_OAUTH_CREDENTIALS_JSON', ''),
            ),

            /*
             * Path to the json file containing the token.
             */
            'token_json' => storage_path(env('GOOGLE_OAUTH_TOKEN_JSON', '')),
        ],
    ],

    /*
     *  The id of the Google Calendar that will be used by default.
     */
    'calendar_id' => env('GOOGLE_CALENDAR_ID'),

    /*
     *  The email address of the user account to impersonate.
     */
    'user_to_impersonate' => env('GOOGLE_CALENDAR_IMPERSONATE'),

    /*
     *  Base URL for webhook notifications from Google Calendar
     *  This should be your application's public URL
     */
    'webhook_base_url' => env('GOOGLE_CALENDAR_WEBHOOK_BASE_URL', env('APP_URL')),
];
