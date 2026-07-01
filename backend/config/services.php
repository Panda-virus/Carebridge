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

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ai_chat' => [
        'enabled' => env('AI_CHAT_ENABLED', false),
        'api_url' => env('AI_CHAT_API_URL'),
        'api_key' => env('AI_CHAT_API_KEY'),
        'model' => env('AI_CHAT_MODEL', 'carebridge-assistant'),
        'temperature' => env('AI_CHAT_TEMPERATURE', 0.4),
        'timeout' => env('AI_CHAT_TIMEOUT', 60),
    ],

    'carebridge_ai' => [
        'enabled' => env('CAREBRIDGE_AI_ENABLED', true),
        'url' => env('CAREBRIDGE_AI_URL', 'http://127.0.0.1:8100'),
        'timeout' => env('CAREBRIDGE_AI_TIMEOUT', 30),
    ],

];
