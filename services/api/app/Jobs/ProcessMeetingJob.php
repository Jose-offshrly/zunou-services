<?php

namespace App\Jobs;

use App\Actions\DataSource\ProcessMeetingDataSourceAction;
use App\Models\DataSource;
use App\Models\Integration;
use App\Models\Meeting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessMeetingJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    private Integration $integration;
    private Meeting $meeting;
    private DataSource $dataSource;
    private string $organizationId;

    public function __construct(
        Integration $integration,
        Meeting $meeting,
        DataSource $dataSource,
        string $organizationId,
    ) {
        $this->integration    = $integration;
        $this->meeting        = $meeting;
        $this->dataSource     = $dataSource;
        $this->organizationId = $organizationId;
    }

    public function handle(
        ProcessMeetingDataSourceAction $processMeetingDataSourceAction,
    ) {
        $processMeetingDataSourceAction->handle(
            integration: $this->integration,
            meeting: $this->meeting,
            dataSource: $this->dataSource,
            organizationId: $this->organizationId,
        );
    }
}
