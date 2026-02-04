<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait FeedHandler
{
    private function recordActivity(
        Model $model,
        array $properties,
        string $description,
        string $feed_type,
        ?string $organization_id = null,
        ?string $receiver_id = null,
        ?string $pulse_id = null,
        ?string $user_id = null,
    ): void {
        $user = Auth::user() ?? User::find($user_id);

        activity()
            ->causedBy($user)
            ->performedOn($model)
            ->tap(function ($activity) use (
                $model,
                $organization_id,
                $receiver_id,
                $pulse_id,
                $feed_type
            ) {
                $activity->organization_id = $organization_id ?? $model->organization_id;
                $activity->receiver_id     = $receiver_id     ?? null;
                $activity->pulse_id        = $pulse_id        ?? null;
                $activity->feed_type       = $feed_type;
            })
            ->withProperties($properties)
            ->log($description);
    }
}
