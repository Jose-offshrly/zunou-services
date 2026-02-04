<?php

namespace App\Http\Controllers;

use App\Actions\FireFlies\StoreUserFireFliesNewMeetingAction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FirefliesWebhookController extends Controller
{
    public function __construct(
        private readonly StoreUserFireFliesNewMeetingAction $storeUserFireFliesNewMeetingAction,
    ) {
    }

    // Updated method signature to accept the api_key from the route.
    public function handle(Request $request, User $user, string $api_key)
    {
        // Log full request for debugging
        Log::info('Webhook received', [
            'headers'   => $request->headers->all(),
            'body'      => $request->getContent(),
            'meetingId' => $request->get('meetingId'),
        ]);

        $this->storeUserFireFliesNewMeetingAction->handle(
            $user,
            $request->get('meetingId'),
            $api_key,
        );

        // Process the payload
        return response()->json(['message' => 'Webhook received'], 200);
    }
}
