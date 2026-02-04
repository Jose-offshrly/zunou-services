<?php

namespace App\Observers;

use App\Enums\PulseStatusOption;
use App\Jobs\MigrateTasksToCustomStatusesJob;
use App\Jobs\MigrateTasksToDefaultStatusesJob;
use App\Models\Pulse;
use App\Models\TaskPhase;
use App\Models\TaskStatus;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Log;

class PulseObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the Pulse "created" event.
     */
    public function created(Pulse $pulse): void
    {
        $this->createDefaultTaskPhases($pulse);
        $this->createDefaultTaskStatuses($pulse);
    }

    /**
     * Handle the Pulse "updated" event.
     */
    public function updated(Pulse $pulse): void
    {
        Log::info("Pulse #{$pulse->id}: updated pulse");

        // Check if status_option changed from DEFAULT to CUSTOM
        if (
            $pulse->wasChanged('status_option') &&
            $pulse->status_option->value === 'custom'
        ) {
            Log::info(
                'PulseObserver: status_option changed from DEFAULT to CUSTOM',
                [
                    'pulse_id' => $pulse->id,
                    'original' => $pulse->getOriginal('status_option'),
                    'current' =>
                        $pulse->status_option?->value ?? $pulse->status_option,
                ]
            );

            MigrateTasksToCustomStatusesJob::dispatch($pulse->id);
        }

        // Check if status_option changed from CUSTOM to DEFAULT
        if (
            $pulse->wasChanged('status_option') &&
            $pulse->status_option->value === 'default'
        ) {
            Log::info(
                'PulseObserver: status_option changed from CUSTOM to DEFAULT',
                [
                    'pulse_id' => $pulse->id,
                    'original' => $pulse->getOriginal('status_option'),
                    'current' =>
                        $pulse->status_option?->value ?? $pulse->status_option,
                ]
            );

            MigrateTasksToDefaultStatusesJob::dispatch($pulse->id);
        }

        $this->clearPulseCaches($pulse);
    }

    /**
     * Handle the Pulse "deleted" event.
     */
    public function deleted(Pulse $pulse): void
    {
        $pulse->notifications()->delete();
        $this->clearPulseCaches($pulse);
    }

    /**
     * Handle the Pulse "restored" event.
     */
    public function restored(Pulse $pulse): void
    {
        $this->clearPulseCaches($pulse);
    }

    private function clearPulseCaches(Pulse $pulse): void
    {
        CacheService::clearPulseCaches($pulse->id);
        CacheService::clearLighthouseCache('Pulse', $pulse->id);

        Log::debug('PulseObserver: cleared caches', ['pulse_id' => $pulse->id]);
    }

    private function createDefaultTaskPhases(Pulse $pulse): void
    {
        $defaultPhases = [
            ['label' => 'Not Started', 'color' => '#6B7280'],
            ['label' => 'In Progress', 'color' => '#3B82F6'],
            ['label' => 'Completed', 'color' => '#10B981'],
            ['label' => 'Blocked', 'color' => '#EF4444'],
            ['label' => 'On Hold', 'color' => '#F59E0B'],
            ['label' => 'Overdue', 'color' => '#DC2626'],
        ];

        foreach ($defaultPhases as $phase) {
            TaskPhase::create([
                'pulse_id' => $pulse->id,
                'label' => $phase['label'],
                'color' => $phase['color'],
            ]);
        }
    }

    private function createDefaultTaskStatuses(Pulse $pulse): void
    {
        $defaultStatuses = [
            ['label' => 'Planning', 'color' => '#8B5CF6'],
            ['label' => 'Design', 'color' => '#EC4899'],
            ['label' => 'Development', 'color' => '#3B82F6'],
            ['label' => 'Testing', 'color' => '#F59E0B'],
            ['label' => 'Deployment', 'color' => '#10B981'],
            ['label' => 'Maintenance', 'color' => '#6B7280'],
        ];

        // Determine current max position for this pulse (only custom statuses)
        $maxPosition =
            TaskStatus::where('pulse_id', $pulse->id)
                ->whereNull('type')
                ->max('position') ?? 0;

        foreach ($defaultStatuses as $status) {
            $maxPosition++;

            TaskStatus::create([
                'pulse_id' => $pulse->id,
                'label' => $status['label'],
                'color' => $status['color'],
                'position' => $maxPosition,
            ]);
        }
    }
}
