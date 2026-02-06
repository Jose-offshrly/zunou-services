<?php

namespace App\Observers;

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
                'label'    => $phase['label'],
                'color'    => $phase['color'],
            ]);
        }
    }

    private function createDefaultTaskStatuses(Pulse $pulse): void
    {
        $defaultStatuses = [
            ['system_type' => 'start', 'label' => 'Open', 'color' => '#8B5CF6', 'position' => 0],
            ['system_type' => 'middle', 'label' => 'In Progress', 'color' => '#3B82F6', 'position' => 1],
            ['system_type' => 'end', 'label' => 'Closed', 'color' => '#6B7280', 'position' => 2],
        ];

        foreach ($defaultStatuses as $status) {
            TaskStatus::create([
                'pulse_id' => $pulse->id,
                'label'    => $status['label'],
                'color'    => $status['color'],
                'system_type' => $status['system_type'],
            ]);
        }
    }

}