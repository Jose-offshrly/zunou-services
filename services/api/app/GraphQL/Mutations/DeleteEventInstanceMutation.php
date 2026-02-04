<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\EventInstance;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class DeleteEventInstanceMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $eventInstance = EventInstance::find($args['id']);
            if (! $eventInstance) {
                throw new Error('Event instance not found!');
            }

            Log::info('Deleting event instance', [
                'event_instance_id' => $eventInstance->id,
                'event_id'          => $eventInstance->event_id,
                'pulse_id'          => $eventInstance->pulse_id,
            ]);

            // Delete the event instance from the database
            $eventInstance->delete();

            Log::info('Successfully deleted event instance', [
                'event_instance_id' => $eventInstance->id,
            ]);

            return $eventInstance;
        } catch (\Exception $e) {
            Log::error('Failed to delete event instance', [
                'event_instance_id' => $args['id'] ?? null,
                'error'             => $e->getMessage(),
                'trace'              => $e->getTraceAsString(),
            ]);

            throw new Error('Failed to delete event instance: ' . $e->getMessage());
        }
    }
}

