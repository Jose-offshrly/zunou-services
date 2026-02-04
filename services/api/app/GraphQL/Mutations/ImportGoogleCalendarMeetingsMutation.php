<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\MeetingSession\ImportGoogleCalendarMeetingsAction;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ImportGoogleCalendarMeetingsMutation
{
    public function __construct(
        protected ImportGoogleCalendarMeetingsAction $importGoogleCalendarMeetingsAction,
    ) {
    }

    public function __invoke($_, array $args): array
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            if (! $user) {
                throw new \Exception('User not authenticated');
            }

            return $this->importGoogleCalendarMeetingsAction->handle(
                pulseId: $args['pulseId'],
                organizationId: $args['organizationId'],
                userId: $user->id,
            );
        } catch (\Exception $e) {
            Log::error('Failed to import Google Calendar meetings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
