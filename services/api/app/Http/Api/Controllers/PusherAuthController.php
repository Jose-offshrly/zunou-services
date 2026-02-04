<?php

namespace App\Http\Api\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Pusher\Pusher;
use Pusher\PusherException;

class PusherAuthController extends Controller
{
    public function __invoke(Request $request)
    {
        try {
            $pusher = new Pusher(
                config('broadcasting.connections.pusher.key'),
                config('broadcasting.connections.pusher.secret'),
                config('broadcasting.connections.pusher.app_id'),
                config('broadcasting.connections.pusher.options'),
            );

            $channelName = $request->channel_name;
            $socketId    = $request->socket_id;

            // Check if the channel is a presence channel
            if (Str::startsWith($channelName, 'presence-')) {
                // Authenticate presence channel
                $presenceData = [
                    'user_id'   => auth()->id(),
                    'user_info' => [
                        'name' => auth()->user()->name,
                    ],
                ];

                // Use authorizePresenceChannel instead of presence_auth
                $auth = $pusher->authorizePresenceChannel(
                    $channelName,
                    $socketId,
                    auth()->id(),
                    $presenceData,
                );
            } else {
                // Authenticate private channel
                $auth = $pusher->authorizeChannel($channelName, $socketId);
            }

            Log::info('Pusher auth:' . json_encode($auth));

            return $auth;
        } catch (PusherException $e) {
            Log::error('Pusher auth error', [$e]);
            return response()->json('error while authenticating');
        }
    }
}
