<?php

namespace App\GraphQL\Mutations;

use App\Models\MisalignmentAlert;
use Illuminate\Support\Facades\Log;

class AcknowledgeMisalignmentAlertMutation
{
    /**
     * Acknowledge a misalignment alert.
     */
    public function __invoke($root, array $args)
    {
        // Find the alert by ID
        $alert = MisalignmentAlert::findOrFail($args['id']);

        // Check if the alert belongs to the provided organizationId
        if ($alert->organization_id !== $args['organizationId']) {
            throw new \Exception('Organization mismatch.');
        }

        // Mark it as acknowledged
        $alert->acknowledged    = true;
        $alert->acknowledged_at = now();
        $alert->save();

        Log::info("Misalignment alert {$alert->id} acknowledged by manager.");

        // Return the updated alert
        return $alert;
    }
}
