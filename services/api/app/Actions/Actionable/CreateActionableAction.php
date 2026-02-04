<?php

declare(strict_types=1);

namespace App\Actions\Actionable;

use App\DataTransferObjects\ActionableData;
use App\Models\Actionable;

final class CreateActionableAction
{
    public function handle(ActionableData $data): Actionable
    {
        $actionable = Actionable::create([
            'description'     => $data->description,
            'pulse_id'        => $data->pulse_id,
            'organization_id' => $data->organization_id,
            'data_source_id'  => $data->data_source_id,
            'event_id'        => $data->event_id,
            'task_id'         => $data->task_id,
            'status'          => $data->status,
        ]);

        return $actionable->refresh();
    }
}
