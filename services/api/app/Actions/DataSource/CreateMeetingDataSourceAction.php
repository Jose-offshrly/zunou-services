<?php

namespace App\Actions\DataSource;

use App\Events\DataSourceCreated;
use App\Models\DataSource;
use App\Models\Meeting;
use Illuminate\Support\Str;

class CreateMeetingDataSourceAction
{
    public function handle(
        Meeting $meeting,
        string $organizationId,
        string $pulseId,
        ?bool $update_meeting = true,
        ?string $origin = null,
    ): DataSource {
        $dataSource = DataSource::create([
            'id'              => Str::uuid()->toString(),
            'description'     => $meeting->title,
            'name'            => $meeting->title,
            'organization_id' => $organizationId,
            'type'            => 'text',
            'pulse_id'        => $pulseId,
            'origin'          => $origin ?? 'meeting',
            'is_viewable'     => false,
            'created_by'      => $meeting->user_id,
        ]);

        DataSourceCreated::dispatch(
            $dataSource->organization_id,
            $dataSource->pulse_id,
        );

        if ($update_meeting) {
            $meeting->data_source_id = $dataSource->id;
            $meeting->save();
        }

        return $dataSource->refresh();
    }
}
