<?php

namespace App\Http\Controllers;

use App\Actions\GoogleCalendar\HandleGoogleCalendarWebhookAction;
use App\DataTransferObjects\GoogleWebhookNotificationData;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GoogleCalendarWebhookController extends Controller
{
    public function handle(Request $request)
    {
        try {
            // Get user ID from X-Goog-Channel-Token header
            $userId = $request->header('X-Goog-Channel-Token');
            $channelId = $request->header('X-Goog-Channel-ID');
            $resourceId = $request->header('X-Goog-Resource-ID');

            Log::info('Google Calendar webhook received', [
                'user_id'    => $userId,
                'channel_id' => $channelId,
                'resource_id' => $resourceId,
                'headers'    => $request->headers->all(),
                'body'       => $request->getContent(),
            ]);

            // Validate user ID is provided
            if (! $userId) {
                Log::warning('Google Calendar webhook received without user ID in token header');

                return response()->json([
                    'message' => 'User ID not provided in webhook token',
                ], 200);
            }

            // Find user by ID
            $user = User::find($userId);

            if (! $user) {
                Log::warning('Google Calendar webhook received for non-existent user', [
                    'user_id' => $userId,
                ]);

                return response()->json([
                    'message' => 'User not found',
                ], 200);
            }

            // Validate user has Google Calendar linked
            if (! $user->google_calendar_linked || ! $user->google_calendar_refresh_token) {
                Log::warning('Google Calendar webhook received for user without linked calendar', [
                    'user_id'           => $user->id,
                    'is_linked'         => $user->google_calendar_linked,
                    'has_refresh_token' => ! empty($user->google_calendar_refresh_token),
                ]);

                return response()->json([
                    'message' => 'User does not have Google Calendar linked',
                ], 200);
            }

            $cacheKey  = 'gcal_sync_token_user_'.$user->id;
            $prevToken = Cache::get($cacheKey);

            $notification = GoogleWebhookNotificationData::fromRequest($request, $prevToken);

            // Validate webhook channel matches user's stored channel
            if ($notification->channelId && $notification->resourceId) {
                if ($user->google_calendar_channel_id !== $notification->channelId ||
                    $user->google_calendar_resource_id !== $notification->resourceId) {
                    Log::warning('Google Calendar webhook channel mismatch', [
                        'user_id'                    => $user->id,
                        'stored_channel_id'           => $user->google_calendar_channel_id,
                        'received_channel_id'         => $notification->channelId,
                        'stored_resource_id'          => $user->google_calendar_resource_id,
                        'received_resource_id'        => $notification->resourceId,
                        'resource_state'              => $notification->resourceState,
                    ]);

                    // If it's a sync notification (exists), we might want to process it anyway
                    // but log the mismatch for investigation
                    if ($notification->resourceState !== 'exists') {
                        return response()->json([
                            'message' => 'Webhook channel validation failed',
                        ], 200);
                    }
                }
            }

            /** @var HandleGoogleCalendarWebhookAction $action */
            $action = app(HandleGoogleCalendarWebhookAction::class);
            $result = $action->handle($user, $notification);

            if (! empty($result['nextSyncToken'])) {
                Cache::put($cacheKey, $result['nextSyncToken'], 60 * 60 * 24 * 14);
            }

            return response()->json($result, 200);
        } catch (\Exception $e) {
            Log::error('Error processing Google Calendar webhook', [
                'user_id'    => $request->header('X-Goog-Channel-Token'),
                'error'      => $e->getMessage(),
                'error_code' => $e->getCode(),
                'trace'      => $e->getTraceAsString(),
            ]);

            // Always return 200 to Google to prevent retries for our errors
            return response()->json([
                'message' => 'Error processing webhook',
                'error'   => $e->getMessage(),
            ], 200);
        }
    }
}
