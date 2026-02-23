<?php

namespace App\Jobs;

use App\Models\Event;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Cleans up duplicate events and event instances created by the old sync implementation.
 *
 * Old implementation: Events were created per user, per org, per pulse.
 * New implementation: Events are unique per (organization_id, google_event_id).
 *
 * This job:
 * 1. Deduplicates events by (organization_id, google_event_id) - keeps one per org
 * 2. Reassigns child records (instances, sessions, agendas, etc.) from losers to winner
 * 3. Deduplicates event_instances by (event_id, pulse_id) - keeps one per pulse
 * 4. Nullifies user_id and pulse_id on deduplicated events (now org-level)
 * 5. Deletes orphaned future events (March 2026+) with no child records
 *
 * Timeout handling (two layers):
 * - Primary: isApproachingTimeout() at 70% of $timeout (609s of 870s) — proactively
 *   dispatches a continuation job between loop iterations.
 * - Safety net: Catches Vapor's VaporJobTimedOutException (thrown via pcntl_alarm at
 *   $timeout) in handle()'s catch block and dispatches a continuation instead of
 *   consuming a retry attempt. This handles the case where a single DB operation
 *   runs longer than the remaining budget, bypassing the proactive check.
 */
class CleanupDuplicateEventsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     *
     * Set to 870s (~14.5 min) to leave a 30s buffer before Lambda's 900s
     * hard timeout, allowing time for cleanup logging if the job overruns.
     */
    public int $timeout = 870;

    /**
     * The number of seconds after which the job's unique lock will be released.
     *
     * Prevents concurrent execution via SQS message redelivery. Set to 30 min
     * to cover the full execution + retry window.
     */
    public int $uniqueFor = 1800;

    /**
     * Cached Event morph class string to avoid repeated model instantiation
     * on memory-constrained Lambda environments.
     */
    private ?string $eventMorphClass = null;

    /**
     * Timestamp (from microtime) when the job started executing.
     * Used to calculate elapsed time per phase and detect approaching timeout.
     */
    private float $startedAt = 0;

    /**
     * Running cumulative stats across all phases.
     *
     * Promoted to a job-level property so the Vapor timeout safety net
     * (catch block) can access them when dispatching a continuation.
     *
     * @var array<string, int>
     */
    private array $stats = [];

    /**
     * The phase currently being executed (1-4).
     *
     * Tracked at job level so the Vapor timeout catch block knows
     * which phase to resume from when dispatching a continuation.
     */
    private int $currentPhase = 1;

    /**
     * The last fully-completed organization ID in Phase 1.
     *
     * Used by the Vapor timeout catch block to resume Phase 1
     * from the correct position.
     */
    private ?string $lastCompletedOrgId = null;

    /**
     * The last fully-completed event ID in Phase 2.
     *
     * Used by the Vapor timeout catch block to resume Phase 2
     * from the correct position.
     */
    private ?string $lastCompletedEventId = null;

    /**
     * Create a new job instance.
     *
     * @param  bool  $dryRun  When true, logs what would be changed without modifying data.
     * @param  int  $startPhase  Phase to start from (1-4). Used for resuming after timeout.
     * @param  string|null  $resumeAfterOrgId  Resume Phase 1 after this org ID (skip already-processed orgs).
     * @param  string|null  $resumeAfterEventId  Resume Phase 2 after this event ID (skip already-processed events).
     * @param  array<string, int>  $carryOverStats  Cumulative stats from prior continuation runs.
     */
    public function __construct(
        private bool $dryRun = false,
        private int $startPhase = 1,
        private ?string $resumeAfterOrgId = null,
        private ?string $resumeAfterEventId = null,
        private array $carryOverStats = [],
    ) {}

    /**
     * Get the cached Event morph class string.
     *
     * Avoids instantiating a new Event model on every call, reducing memory
     * churn on Lambda where this is called once per loser event.
     */
    private function getEventMorphClass(): string
    {
        return $this->eventMorphClass ??= (new Event)->getMorphClass();
    }

    /**
     * Execute the job.
     *
     * Orchestrates the four-phase cleanup, supporting resumption from any phase
     * if a previous run timed out. Each phase checks the remaining time budget
     * and self-dispatches a continuation job if approaching the timeout.
     *
     * Phase 1 - Deduplicates events by (organization_id, google_event_id).
     * Phase 2 - Deduplicates event_instances by (event_id, pulse_id).
     * Phase 3 - Backfills event_instance_id on meeting_sessions, agendas, checklists, actionables.
     * Phase 4 - Deletes orphaned future events (March 2026+) with no child records.
     *
     * Logs a summary of all changes (or would-be changes in dry-run mode).
     *
     * @return void
     *
     * @throws \Exception If the cleanup fails at any point.
     */
    public function handle(): void
    {
        $this->startedAt = microtime(true);
        $this->currentPhase = $this->startPhase;
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        Log::info("{$prefix}Starting CleanupDuplicateEventsJob", [
            'start_phase'           => $this->startPhase,
            'resume_after_org_id'   => $this->resumeAfterOrgId,
            'resume_after_event_id' => $this->resumeAfterEventId,
            'carry_over_stats'      => $this->carryOverStats ?: null,
        ]);

        try {
            // Merge carry-over stats from prior continuation runs so the final
            // "completed" log reflects cumulative totals across all runs.
            // Stored on the job instance so the Vapor timeout catch block can
            // access them when dispatching a continuation.
            $this->stats = array_merge([
                'duplicate_event_groups'         => 0,
                'events_deleted'                 => 0,
                'duplicate_instance_groups'      => 0,
                'instances_deleted'              => 0,
                'child_records_reassigned'       => 0,
                'events_nullified'               => 0,
                'event_instance_ids_backfilled'  => 0,
                'orphaned_future_events_deleted' => 0,
            ], $this->carryOverStats);

            if ($this->startPhase <= 1) {
                $this->currentPhase = 1;
                if (! $this->deduplicateEvents($this->stats)) {
                    return; // Continuation dispatched, stop this run
                }
            }

            if ($this->startPhase <= 2) {
                $this->currentPhase = 2;
                if (! $this->deduplicateEventInstances($this->stats)) {
                    return; // Continuation dispatched, stop this run
                }
            }

            if ($this->startPhase <= 3) {
                $this->currentPhase = 3;
                if (! $this->backfillEventInstanceIds($this->stats)) {
                    return; // Continuation dispatched, stop this run
                }
            }

            if ($this->startPhase <= 4) {
                $this->currentPhase = 4;
                if (! $this->deleteOrphanedFutureEvents($this->stats)) {
                    return; // Continuation dispatched, stop this run
                }
            }

            $elapsed = round(microtime(true) - $this->startedAt, 1);
            Log::info("{$prefix}CleanupDuplicateEventsJob completed in {$elapsed}s", $this->stats);
        } catch (\Exception $e) {
            // Safety net: Vapor's VaporJobTimedOutException fires via pcntl_alarm
            // when the job exceeds $timeout. This can interrupt mid-SQL-query,
            // bypassing our isApproachingTimeout() checks entirely. When this
            // happens, dispatch a continuation instead of consuming a retry attempt.
            if ($this->isVaporTimeout($e)) {
                $elapsed = round(microtime(true) - $this->startedAt, 1);
                Log::warning("{$prefix}Vapor timeout intercepted after {$elapsed}s in Phase {$this->currentPhase} — dispatching continuation", [
                    'phase'                 => $this->currentPhase,
                    'last_completed_org_id' => $this->lastCompletedOrgId,
                    'last_completed_event_id' => $this->lastCompletedEventId,
                    'stats_so_far'          => $this->stats,
                    'original_exception'    => $e->getMessage(),
                ]);

                $this->dispatchContinuation(
                    $this->currentPhase,
                    $this->stats,
                    $this->currentPhase === 1 ? $this->lastCompletedOrgId : null,
                    $this->currentPhase === 2 ? $this->lastCompletedEventId : null,
                );

                // Remove this SQS message so it doesn't retry from scratch.
                // The continuation job is a NEW message with resume state.
                $this->delete();

                return;
            }

            Log::error('CleanupDuplicateEventsJob failed: '.$e->getMessage(), [
                'exception' => $e,
                'elapsed_s' => round(microtime(true) - $this->startedAt, 1),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure after all retries are exhausted.
     *
     * Logs a critical-level message so monitoring/alerting systems can pick it up.
     *
     * @param  \Throwable  $exception  The exception that caused the failure.
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical('CleanupDuplicateEventsJob exhausted all retries and failed permanently', [
            'message'    => $exception->getMessage(),
            'start_phase' => $this->startPhase,
            'dry_run'    => $this->dryRun,
        ]);
    }

    /**
     * Check whether the job is approaching its timeout.
     *
     * Returns true when 70% of the timeout budget has been consumed,
     * leaving a generous buffer for the current DB operation to complete
     * and for the continuation job to be dispatched. The 70% threshold
     * (609s of 870s) provides a ~261s buffer, which accommodates large
     * single UPDATE statements that may take minutes on Lambda with
     * RDS Proxy (e.g., reassigning thousands of meeting_sessions).
     *
     * Previously set to 80% (174s buffer), which was insufficient —
     * Vapor's VaporJobTimedOutException fired mid-query before our
     * check could run. See isVaporTimeout() for the safety net.
     *
     * @return bool
     */
    private function isApproachingTimeout(): bool
    {
        $elapsed = microtime(true) - $this->startedAt;

        return $elapsed >= ($this->timeout * 0.7);
    }

    /**
     * Determine whether an exception is a Vapor job timeout.
     *
     * On Laravel Vapor, the VaporWorker sets a pcntl_alarm that throws
     * VaporJobTimedOutException when the job exceeds its $timeout.
     * This exception can fire mid-SQL-query (via pcntl_async_signals),
     * causing it to be wrapped in a QueryException by Laravel's DB layer.
     *
     * This method checks both the exception itself and its previous
     * exception (the wrapped case) for the Vapor timeout class or
     * its characteristic message.
     *
     * @param  \Exception  $e  The caught exception.
     * @return bool
     */
    private function isVaporTimeout(\Exception $e): bool
    {
        $isTimeout = fn ($ex) => $ex instanceof \Laravel\Vapor\VaporJobTimedOutException
            || str_contains($ex->getMessage(), 'has timed out. It will be retried again.');

        return $isTimeout($e)
            || ($e->getPrevious() && $isTimeout($e->getPrevious()));
    }

    /**
     * Dispatch a continuation job to resume from the given phase and offset.
     *
     * Used when the current job is approaching its timeout. The continuation
     * inherits the dry-run flag, cumulative stats, and picks up where this
     * job left off.
     *
     * Lock lifecycle:
     * 1. Force-releases the ShouldBeUnique lock using UniqueLock::getKey() so the key
     *    matches Laravel's internal format ("laravel_unique_job:{FQCN}:{uniqueId}").
     * 2. self::dispatch() acquires a new lock for the continuation (Job B).
     * 3. After handle() returns, CallQueuedHandler::ensureUniqueJobLockIsReleased()
     *    force-releases the lock again — this prematurely removes Job B's lock.
     *    This is acceptable because Job B is already on the queue and only the
     *    artisan command or the job itself dispatches new instances.
     *
     * @param  int  $phase  The phase to resume from.
     * @param  array<string, int>  $stats  Current cumulative stats to carry forward.
     * @param  string|null  $resumeAfterOrgId  Resume Phase 1 after this org ID.
     * @param  string|null  $resumeAfterEventId  Resume Phase 2 after this event ID.
     * @return void
     */
    private function dispatchContinuation(int $phase, array $stats, ?string $resumeAfterOrgId = null, ?string $resumeAfterEventId = null): void
    {
        $elapsed = round(microtime(true) - $this->startedAt, 1);
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        Log::warning("{$prefix}Approaching timeout after {$elapsed}s — dispatching continuation", [
            'resume_phase'          => $phase,
            'resume_after_org_id'   => $resumeAfterOrgId,
            'resume_after_event_id' => $resumeAfterEventId,
            'stats_so_far'          => $stats,
        ]);

        // Force-release the ShouldBeUnique lock so the continuation can be dispatched.
        // Without this, self::dispatch() would be silently dropped because the
        // current job still holds the unique lock.
        //
        // Laravel's UniqueLock builds the key as "laravel_unique_job:{FQCN}:{uniqueId}".
        // We must match that exact format — using Cache::lock(static::class) alone
        // would release a different key and the continuation would be silently dropped.
        $lockKey = \Illuminate\Bus\UniqueLock::getKey($this);
        Cache::lock($lockKey, $this->uniqueFor)->forceRelease();

        self::dispatch($this->dryRun, $phase, $resumeAfterOrgId, $resumeAfterEventId, $stats);
    }

    /**
     * Step 1: Find and process duplicate event groups by (organization_id, google_event_id).
     *
     * Queries for groups of events that share the same organization and google_event_id,
     * then processes each group to keep only one event per org.
     * Events without a google_event_id are skipped.
     *
     * Supports resumption: if $this->resumeAfterOrgId is set, skips organizations
     * that have already been processed in a prior run.
     *
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return bool  True if phase completed, false if a continuation was dispatched.
     */
    private function deduplicateEvents(array &$stats): bool
    {
        $phaseStart = microtime(true);
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        Log::info("{$prefix}=== Phase 1/4: Event Deduplication ===");

        // Get distinct org IDs that have duplicate events, then process per-org.
        // This avoids holding a long-lived cursor across thousands of groups,
        // which risks RDS Proxy idle connection timeouts on Lambda.
        $orgIdsQuery = DB::table('events')
            ->select('organization_id')
            ->whereNotNull('google_event_id')
            ->groupBy('organization_id')
            ->havingRaw('COUNT(*) > COUNT(DISTINCT google_event_id)')
            ->orderBy('organization_id');

        // If resuming, skip orgs already processed
        if ($this->resumeAfterOrgId) {
            $orgIdsQuery->where('organization_id', '>', $this->resumeAfterOrgId);
            Log::info("{$prefix}Resuming after org_id: {$this->resumeAfterOrgId}");
        }

        $orgIds = $orgIdsQuery->pluck('organization_id');
        $totalOrgs = $orgIds->count();

        // Get upfront total duplicate group count for progress reporting
        $totalDuplicateGroups = DB::table('events')
            ->select('organization_id', 'google_event_id')
            ->whereNotNull('google_event_id')
            ->when($this->resumeAfterOrgId, fn ($q) => $q->where('organization_id', '>', $this->resumeAfterOrgId))
            ->groupBy('organization_id', 'google_event_id')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        Log::info("{$prefix}Found {$totalOrgs} organizations with {$totalDuplicateGroups} duplicate event groups to process");

        $processed = 0;
        $orgsProcessed = 0;
        $lastOrgId = null;

        foreach ($orgIds as $orgId) {
            // Check timeout before processing next org
            if (! $this->dryRun && $this->isApproachingTimeout()) {
                $elapsed = round(microtime(true) - $phaseStart, 1);
                Log::warning("{$prefix}Phase 1 pausing after {$elapsed}s — {$processed}/{$totalDuplicateGroups} groups processed ({$orgsProcessed}/{$totalOrgs} orgs)");
                $this->dispatchContinuation(1, $stats, $lastOrgId);

                return false;
            }

            // Per-org query is bounded and short-lived — safe for RDS Proxy
            $groups = DB::table('events')
                ->select('organization_id', 'google_event_id', DB::raw('COUNT(*) as cnt'))
                ->where('organization_id', $orgId)
                ->whereNotNull('google_event_id')
                ->groupBy('organization_id', 'google_event_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($groups as $group) {
                // Check timeout within the org's group loop — a single org may
                // have thousands of duplicate groups. Use $lastOrgId (the previous
                // fully-completed org) so the current org is re-processed from
                // scratch; this is safe because already-deduplicated groups won't
                // match HAVING COUNT(*) > 1.
                if (! $this->dryRun && $this->isApproachingTimeout()) {
                    $elapsed = round(microtime(true) - $phaseStart, 1);
                    Log::warning("{$prefix}Phase 1 pausing mid-org after {$elapsed}s — {$processed}/{$totalDuplicateGroups} groups processed ({$orgsProcessed}/{$totalOrgs} orgs)");
                    $this->dispatchContinuation(1, $stats, $lastOrgId);

                    return false;
                }

                $this->processDuplicateEventGroup($group, $stats);
                $stats['duplicate_event_groups']++;
                $processed++;

                if ($processed % 100 === 0) {
                    $pct = $totalDuplicateGroups > 0 ? round(($processed / $totalDuplicateGroups) * 100, 1) : 0;
                    Log::info("{$prefix}Phase 1 progress: {$processed}/{$totalDuplicateGroups} groups ({$pct}%) — {$stats['events_deleted']} events deleted, {$stats['child_records_reassigned']} children reassigned");
                }
            }

            $lastOrgId = $orgId;
            $this->lastCompletedOrgId = $orgId;
            $orgsProcessed++;
        }

        // Clear resume cursor — Phase 1 is complete
        $this->resumeAfterOrgId = null;

        $elapsed = round(microtime(true) - $phaseStart, 1);
        Log::info("{$prefix}=== Phase 1 complete in {$elapsed}s: {$processed} groups across {$orgsProcessed} orgs — {$stats['events_deleted']} events deleted, {$stats['events_nullified']} events nullified ===");

        return true;
    }

    /**
     * Process a single duplicate event group: pick winner, reassign children, delete losers.
     *
     * Within a DB transaction, reassigns all child records from loser events to the winner,
     * hard-deletes the losers, and nullifies user_id/pulse_id on the winner (now org-level).
     *
     * @param  object  $group  A row from the duplicate groups query (organization_id, google_event_id, cnt).
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return void
     */
    private function processDuplicateEventGroup(object $group, array &$stats): void
    {
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        $events = DB::table('events')
            ->where('organization_id', $group->organization_id)
            ->where('google_event_id', $group->google_event_id)
            ->get();

        if ($events->count() <= 1) {
            return;
        }

        $winner   = $this->selectWinnerEvent($events);
        $loserIds = $events->where('id', '!=', $winner->id)->pluck('id')->toArray();

        Log::debug("{$prefix}Processing duplicate event group", [
            'organization_id' => $group->organization_id,
            'google_event_id' => $group->google_event_id,
            'total_events'    => $events->count(),
            'winner_id'       => $winner->id,
            'loser_ids'       => $loserIds,
        ]);

        if ($this->dryRun) {
            // Count child records that would be reassigned from losers
            $eventMorphClass = $this->getEventMorphClass();
            $stats['child_records_reassigned'] += DB::table('event_instances')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('meeting_sessions')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('event_meeting_session')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('agendas')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('checklists')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('actionables')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('meetings')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('event_owners')
                ->whereIn('event_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('attendees')
                ->where('entity_type', $eventMorphClass)
                ->whereIn('entity_id', $loserIds)
                ->count();

            $stats['events_deleted'] += count($loserIds);
            $stats['events_nullified']++;

            return;
        }

        DB::transaction(function () use ($winner, $loserIds, &$stats) {
            // Track current_meeting_session_id — only fetch winner once, not per loser
            $winnerCurrentSessionId = $winner->current_meeting_session_id;

            foreach ($loserIds as $loserId) {
                $winnerCurrentSessionId = $this->reassignEventChildren(
                    $winner->id, $loserId, $winnerCurrentSessionId, $stats
                );
            }

            // Hard-delete losers
            DB::table('events')
                ->whereIn('id', $loserIds)
                ->delete();
            $stats['events_deleted'] += count($loserIds);

            // Nullify user_id and pulse_id on winner (now org-level)
            DB::table('events')
                ->where('id', $winner->id)
                ->update(['user_id' => null, 'pulse_id' => null]);
            $stats['events_nullified']++;
        });
    }

    /**
     * Select the winner event from a duplicate group.
     *
     * Priority order (highest to lowest):
     * 1. Has current_meeting_session_id set (direct FK to active session)
     * 2. Referenced in meeting_sessions.event_id (has associated sessions)
     * 3. Referenced in event_meeting_session pivot table
     * 4. Fallback: most recently created (created_at DESC)
     *
     * Within the same priority tier, the most recently created event wins.
     *
     * @param  Collection  $events  Collection of event stdClass objects from DB query.
     * @return object  The winning event stdClass object.
     */
    private function selectWinnerEvent(Collection $events): object
    {
        // Priority 1: Has current_meeting_session_id
        $withCurrentSession = $events->filter(fn ($e) => ! is_null($e->current_meeting_session_id));
        if ($withCurrentSession->isNotEmpty()) {
            return $withCurrentSession->sortByDesc('created_at')->first();
        }

        // Priority 2: Referenced in meeting_sessions.event_id
        $eventIds = $events->pluck('id')->toArray();
        $referencedInMeetingSessions = DB::table('meeting_sessions')
            ->whereIn('event_id', $eventIds)
            ->pluck('event_id')
            ->unique()
            ->toArray();

        $withMeetingSession = $events->filter(fn ($e) => in_array($e->id, $referencedInMeetingSessions));
        if ($withMeetingSession->isNotEmpty()) {
            return $withMeetingSession->sortByDesc('created_at')->first();
        }

        // Priority 3: Referenced in event_meeting_session pivot
        $referencedInPivot = DB::table('event_meeting_session')
            ->whereIn('event_id', $eventIds)
            ->pluck('event_id')
            ->unique()
            ->toArray();

        $withPivot = $events->filter(fn ($e) => in_array($e->id, $referencedInPivot));
        if ($withPivot->isNotEmpty()) {
            return $withPivot->sortByDesc('created_at')->first();
        }

        // Fallback: most recently created
        return $events->sortByDesc('created_at')->first();
    }

    /**
     * Reassign all child records from a loser event to the winner event.
     *
     * Handles the following related tables:
     * - event_instances (reassigned; pulse-level dedup handled in step 2)
     * - meeting_sessions (event_id updated)
     * - event_meeting_session pivot (reassigned or deleted if duplicate)
     * - agendas, checklists, actionables, meetings (event_id updated)
     * - event_owners (reassigned or deleted if duplicate entity)
     * - attendees (reassigned or deleted if duplicate user; polymorphic via entity_type/entity_id)
     * - current_meeting_session_id (copied from loser if winner lacks one)
     *
     * @param  string  $winnerId  UUID of the winning event.
     * @param  string  $loserId   UUID of the losing event to reassign from.
     * @param  string|null  $winnerCurrentSessionId  The winner's current_meeting_session_id (avoids re-fetching per loser).
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return string|null  The updated winnerCurrentSessionId (may have been copied from loser).
     */
    private function reassignEventChildren(string $winnerId, string $loserId, ?string $winnerCurrentSessionId, array &$stats): ?string
    {
        // 1. Event instances - reassign all to winner (including soft-deleted)
        //    (pulse-level duplicates will be cleaned in deduplicateEventInstances)
        $count = DB::table('event_instances')
            ->where('event_id', $loserId)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 2. Meeting sessions - reassign event_id
        $count = DB::table('meeting_sessions')
            ->where('event_id', $loserId)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 3. Event-meeting session pivot - reassign non-duplicate entries, delete duplicates
        $existingPivotSessionIds = DB::table('event_meeting_session')
            ->where('event_id', $winnerId)
            ->pluck('meeting_session_id')
            ->toArray();

        $count = DB::table('event_meeting_session')
            ->where('event_id', $loserId)
            ->whereNotIn('meeting_session_id', $existingPivotSessionIds)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // Delete remaining duplicate pivot entries that can't be reassigned
        DB::table('event_meeting_session')
            ->where('event_id', $loserId)
            ->delete();

        // 4. Agendas
        $count = DB::table('agendas')
            ->where('event_id', $loserId)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 5. Checklists
        $count = DB::table('checklists')
            ->where('event_id', $loserId)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 6. Actionables
        $count = DB::table('actionables')
            ->where('event_id', $loserId)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 7. Meetings
        $count = DB::table('meetings')
            ->where('event_id', $loserId)
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 8. Event owners - reassign non-duplicate entries in bulk, delete duplicates.
        // Uses a NOT EXISTS subquery instead of per-row queries to avoid N+1
        // round trips through RDS Proxy (previously ~1 query per owner per loser).
        $count = DB::table('event_owners')
            ->where('event_id', $loserId)
            ->whereNotExists(function ($q) use ($winnerId) {
                $q->select(DB::raw(1))
                    ->from('event_owners as eo_winner')
                    ->where('eo_winner.event_id', $winnerId)
                    ->whereColumn('eo_winner.entity_type', 'event_owners.entity_type')
                    ->whereColumn('eo_winner.entity_id', 'event_owners.entity_id');
            })
            ->update(['event_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // Delete remaining duplicate owner entries from loser
        DB::table('event_owners')
            ->where('event_id', $loserId)
            ->delete();

        // 9. Attendees (polymorphic) - reassign non-duplicate entries, delete duplicates
        $eventMorphClass = $this->getEventMorphClass();

        $existingAttendeeUserIds = DB::table('attendees')
            ->where('entity_type', $eventMorphClass)
            ->where('entity_id', $winnerId)
            ->pluck('user_id')
            ->filter()  // Remove NULLs from the list
            ->toArray();

        $winnerHasNullUserAttendee = DB::table('attendees')
            ->where('entity_type', $eventMorphClass)
            ->where('entity_id', $winnerId)
            ->whereNull('user_id')
            ->exists();

        // Reassign unique active attendees from loser to winner.
        // SQL NOT IN excludes NULLs, so we handle NULL user_id explicitly
        // to prevent silent data loss of guest/anonymous attendees.
        $reassignQuery = DB::table('attendees')
            ->where('entity_type', $eventMorphClass)
            ->where('entity_id', $loserId);

        if ($winnerHasNullUserAttendee) {
            // Winner already has a NULL-user attendee — only reassign non-NULL, non-duplicate
            $reassignQuery->whereNotNull('user_id')
                ->whereNotIn('user_id', $existingAttendeeUserIds);
        } else {
            // Reassign both non-duplicate user_id attendees AND NULL user_id attendees
            $reassignQuery->where(function ($q) use ($existingAttendeeUserIds) {
                $q->where(function ($inner) use ($existingAttendeeUserIds) {
                    $inner->whereNotNull('user_id')
                        ->whereNotIn('user_id', $existingAttendeeUserIds);
                })->orWhereNull('user_id');
            });
        }

        $count = $reassignQuery->update(['entity_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // Delete remaining loser attendees (duplicates + soft-deleted) since the loser event
        // will be hard-deleted and these records would be orphaned
        DB::table('attendees')
            ->where('entity_type', $eventMorphClass)
            ->where('entity_id', $loserId)
            ->delete();

        // 10. Copy current_meeting_session_id from loser if winner doesn't have one.
        // winnerCurrentSessionId is passed in to avoid re-fetching the winner event
        // for every loser (saves 1 query per loser).
        if (empty($winnerCurrentSessionId)) {
            $loserEvent = DB::table('events')->where('id', $loserId)->first();

            if (! empty($loserEvent->current_meeting_session_id)) {
                DB::table('events')
                    ->where('id', $winnerId)
                    ->update(['current_meeting_session_id' => $loserEvent->current_meeting_session_id]);
                $winnerCurrentSessionId = $loserEvent->current_meeting_session_id;
            }
        }

        return $winnerCurrentSessionId;
    }

    /**
     * Step 2: Find and process duplicate event instance groups by (event_id, pulse_id).
     *
     * Queries for groups of event instances that share the same event and pulse,
     * then processes each group to keep only one instance per (event_id, pulse_id).
     * This runs after event deduplication, so reassigned instances may have created new duplicates.
     *
     * Supports resumption: if $this->resumeAfterEventId is set, skips events
     * that have already been processed in a prior run.
     *
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return bool  True if phase completed, false if a continuation was dispatched.
     */
    private function deduplicateEventInstances(array &$stats): bool
    {
        $phaseStart = microtime(true);
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        Log::info("{$prefix}=== Phase 2/4: Event Instance Deduplication ===");

        // Get distinct event IDs that have duplicate instances, then process per-event.
        // This avoids holding a long-lived cursor across thousands of groups,
        // which risks RDS Proxy idle connection timeouts on Lambda.
        $eventIdsQuery = DB::table('event_instances')
            ->select('event_id')
            ->groupBy('event_id')
            ->havingRaw('COUNT(*) > COUNT(DISTINCT pulse_id)')
            ->orderBy('event_id');

        // If resuming, skip events already processed
        if ($this->resumeAfterEventId) {
            $eventIdsQuery->where('event_id', '>', $this->resumeAfterEventId);
            Log::info("{$prefix}Resuming after event_id: {$this->resumeAfterEventId}");
        }

        $eventIds = $eventIdsQuery->pluck('event_id');
        $totalEvents = $eventIds->count();

        // Get upfront total duplicate instance group count
        $totalDuplicateGroups = DB::table('event_instances')
            ->select('event_id', 'pulse_id')
            ->when($this->resumeAfterEventId, fn ($q) => $q->where('event_id', '>', $this->resumeAfterEventId))
            ->groupBy('event_id', 'pulse_id')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        Log::info("{$prefix}Found {$totalEvents} events with {$totalDuplicateGroups} duplicate instance groups to process");

        $processed = 0;
        $eventsProcessed = 0;
        $lastEventId = null;

        foreach ($eventIds as $eventId) {
            // Check timeout before processing next event
            if (! $this->dryRun && $this->isApproachingTimeout()) {
                $elapsed = round(microtime(true) - $phaseStart, 1);
                Log::warning("{$prefix}Phase 2 pausing after {$elapsed}s — {$processed}/{$totalDuplicateGroups} groups processed ({$eventsProcessed}/{$totalEvents} events)");
                $this->dispatchContinuation(2, $stats, null, $lastEventId);

                return false;
            }

            // Per-event query is bounded and short-lived — safe for RDS Proxy
            $groups = DB::table('event_instances')
                ->select('event_id', 'pulse_id', DB::raw('COUNT(*) as cnt'))
                ->where('event_id', $eventId)
                ->groupBy('event_id', 'pulse_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($groups as $group) {
                // Check timeout within the event's group loop — a single event may
                // have many duplicate instance groups. Use $lastEventId (the previous
                // fully-completed event) so the current event is re-processed from
                // scratch; this is safe because already-deduplicated groups won't
                // match HAVING COUNT(*) > 1.
                if (! $this->dryRun && $this->isApproachingTimeout()) {
                    $elapsed = round(microtime(true) - $phaseStart, 1);
                    Log::warning("{$prefix}Phase 2 pausing mid-event after {$elapsed}s — {$processed}/{$totalDuplicateGroups} groups processed ({$eventsProcessed}/{$totalEvents} events)");
                    $this->dispatchContinuation(2, $stats, null, $lastEventId);

                    return false;
                }

                $this->processDuplicateInstanceGroup($group, $stats);
                $stats['duplicate_instance_groups']++;
                $processed++;

                if ($processed % 100 === 0) {
                    $pct = $totalDuplicateGroups > 0 ? round(($processed / $totalDuplicateGroups) * 100, 1) : 0;
                    Log::info("{$prefix}Phase 2 progress: {$processed}/{$totalDuplicateGroups} groups ({$pct}%) — {$stats['instances_deleted']} instances deleted");
                }
            }

            $lastEventId = $eventId;
            $this->lastCompletedEventId = $eventId;
            $eventsProcessed++;
        }

        // Clear resume cursor — Phase 2 is complete
        $this->resumeAfterEventId = null;

        $elapsed = round(microtime(true) - $phaseStart, 1);
        Log::info("{$prefix}=== Phase 2 complete in {$elapsed}s: {$processed} groups across {$eventsProcessed} events — {$stats['instances_deleted']} instances deleted ===");

        return true;
    }

    /**
     * Process a single duplicate event instance group: pick winner, reassign children, delete losers.
     *
     * Within a DB transaction, reassigns child records from loser instances to the winner
     * and hard-deletes the losers.
     *
     * @param  object  $group  A row from the duplicate groups query (event_id, pulse_id, cnt).
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return void
     */
    private function processDuplicateInstanceGroup(object $group, array &$stats): void
    {
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        $instances = DB::table('event_instances')
            ->where('event_id', $group->event_id)
            ->where('pulse_id', $group->pulse_id)
            ->get();

        if ($instances->count() <= 1) {
            return;
        }

        $winner   = $this->selectWinnerEventInstance($instances);
        $loserIds = $instances->where('id', '!=', $winner->id)->pluck('id')->toArray();

        Log::debug("{$prefix}Processing duplicate instance group", [
            'event_id'        => $group->event_id,
            'pulse_id'        => $group->pulse_id,
            'total_instances' => $instances->count(),
            'winner_id'       => $winner->id,
            'loser_ids'       => $loserIds,
        ]);

        if ($this->dryRun) {
            // Count child records that would be reassigned from losers
            $stats['child_records_reassigned'] += DB::table('meeting_sessions')
                ->whereIn('event_instance_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('agendas')
                ->whereIn('event_instance_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('checklists')
                ->whereIn('event_instance_id', $loserIds)->count();
            $stats['child_records_reassigned'] += DB::table('actionables')
                ->whereIn('event_instance_id', $loserIds)->count();

            $stats['instances_deleted'] += count($loserIds);

            return;
        }

        DB::transaction(function () use ($winner, $loserIds, &$stats) {
            foreach ($loserIds as $loserId) {
                $this->reassignEventInstanceChildren($winner->id, $loserId, $stats);
            }

            // Hard-delete losers
            DB::table('event_instances')
                ->whereIn('id', $loserIds)
                ->delete();
            $stats['instances_deleted'] += count($loserIds);
        });
    }

    /**
     * Select the winner event instance from a duplicate group.
     *
     * Priority order (highest to lowest):
     * 1. Referenced in meeting_sessions.event_instance_id (has associated session)
     * 2. Has agendas, checklists, or actionables attached
     * 3. Fallback: most recently created (created_at DESC)
     *
     * Within the same priority tier, the most recently created instance wins.
     *
     * @param  Collection  $instances  Collection of event_instance stdClass objects from DB query.
     * @return object  The winning event instance stdClass object.
     */
    private function selectWinnerEventInstance(Collection $instances): object
    {
        $instanceIds = $instances->pluck('id')->toArray();

        // Priority 1: Referenced in meeting_sessions.event_instance_id
        $referencedInMeetingSessions = DB::table('meeting_sessions')
            ->whereIn('event_instance_id', $instanceIds)
            ->pluck('event_instance_id')
            ->unique()
            ->toArray();

        $withMeetingSession = $instances->filter(fn ($i) => in_array($i->id, $referencedInMeetingSessions));
        if ($withMeetingSession->isNotEmpty()) {
            return $withMeetingSession->sortByDesc('created_at')->first();
        }

        // Priority 2: Has agendas, checklists, or actionables
        $withAgendas = DB::table('agendas')
            ->whereIn('event_instance_id', $instanceIds)
            ->pluck('event_instance_id')
            ->unique()
            ->toArray();

        $withChecklists = DB::table('checklists')
            ->whereIn('event_instance_id', $instanceIds)
            ->pluck('event_instance_id')
            ->unique()
            ->toArray();

        $withActionables = DB::table('actionables')
            ->whereIn('event_instance_id', $instanceIds)
            ->pluck('event_instance_id')
            ->unique()
            ->toArray();

        $withContent = $instances->filter(
            fn ($i) => in_array($i->id, $withAgendas) || in_array($i->id, $withChecklists) || in_array($i->id, $withActionables)
        );
        if ($withContent->isNotEmpty()) {
            return $withContent->sortByDesc('created_at')->first();
        }

        // Fallback: most recently created
        return $instances->sortByDesc('created_at')->first();
    }

    /**
     * Reassign all child records from a loser event instance to the winner.
     *
     * Handles the following related tables:
     * - meeting_sessions (event_instance_id updated)
     * - agendas (event_instance_id updated)
     * - checklists (event_instance_id updated)
     * - actionables (event_instance_id updated)
     *
     * @param  string  $winnerId  UUID of the winning event instance.
     * @param  string  $loserId   UUID of the losing event instance to reassign from.
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return void
     */
    private function reassignEventInstanceChildren(string $winnerId, string $loserId, array &$stats): void
    {
        // 1. Meeting sessions - reassign event_instance_id
        $count = DB::table('meeting_sessions')
            ->where('event_instance_id', $loserId)
            ->update(['event_instance_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 2. Agendas
        $count = DB::table('agendas')
            ->where('event_instance_id', $loserId)
            ->update(['event_instance_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 3. Checklists
        $count = DB::table('checklists')
            ->where('event_instance_id', $loserId)
            ->update(['event_instance_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;

        // 4. Actionables
        $count = DB::table('actionables')
            ->where('event_instance_id', $loserId)
            ->update(['event_instance_id' => $winnerId]);
        $stats['child_records_reassigned'] += $count;
    }

    /**
     * Step 3: Backfill event_instance_id on child records that have event_id and pulse_id
     * but are missing event_instance_id.
     *
     * For each of meeting_sessions, agendas, checklists, and actionables, finds records where
     * event_instance_id IS NULL and matches them to an event_instance by (event_id, pulse_id).
     *
     * Phase 3 is idempotent — re-running it safely skips already-backfilled rows
     * (they have event_instance_id set), so resumption simply re-starts Phase 3.
     *
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return bool  True if phase completed, false if a continuation was dispatched.
     */
    private function backfillEventInstanceIds(array &$stats): bool
    {
        $phaseStart = microtime(true);
        $prefix = $this->dryRun ? '[DRY RUN] ' : '';

        Log::info("{$prefix}=== Phase 3/4: Backfill event_instance_id ===");

        $tables = ['meeting_sessions', 'agendas', 'checklists', 'actionables'];

        foreach ($tables as $table) {
            // Check timeout before each table
            if (! $this->dryRun && $this->isApproachingTimeout()) {
                $elapsed = round(microtime(true) - $phaseStart, 1);
                Log::warning("{$prefix}Phase 3 pausing after {$elapsed}s before table '{$table}' — {$stats['event_instance_ids_backfilled']} records backfilled so far");
                $this->dispatchContinuation(3, $stats);

                return false;
            }

            if (! $this->backfillEventInstanceIdsForTable($table, $prefix, $stats)) {
                return false; // Continuation dispatched from within the table loop
            }
        }

        $elapsed = round(microtime(true) - $phaseStart, 1);
        Log::info("{$prefix}=== Phase 3 complete in {$elapsed}s: {$stats['event_instance_ids_backfilled']} records backfilled ===");

        return true;
    }

    /**
     * Backfill event_instance_id for a single table by matching (event_id, pulse_id) to event_instances.
     *
     * Uses a PostgreSQL UPDATE ... FROM join to efficiently set event_instance_id in a single query.
     * Only updates records where event_instance_id IS NULL, event_id IS NOT NULL, and pulse_id IS NOT NULL,
     * and a matching non-deleted event_instance exists.
     *
     * @param  string  $table   The table name to backfill (meeting_sessions, agendas, checklists, or actionables).
     * @param  string  $prefix  Log prefix (empty or '[DRY RUN] ').
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return bool  True if table completed, false if a continuation was dispatched.
     */
    private function backfillEventInstanceIdsForTable(string $table, string $prefix, array &$stats): bool
    {
        // Count how many records need backfilling
        $countToBackfill = DB::table($table)
            ->whereNull('event_instance_id')
            ->whereNotNull('event_id')
            ->whereNotNull('pulse_id')
            ->whereExists(function ($query) use ($table) {
                $query->select(DB::raw(1))
                    ->from('event_instances')
                    ->whereColumn('event_instances.event_id', "{$table}.event_id")
                    ->whereColumn('event_instances.pulse_id', "{$table}.pulse_id")
                    ->whereNull('event_instances.deleted_at');
            })
            ->count();

        if ($countToBackfill === 0) {
            Log::info("{$prefix}No {$table} records need event_instance_id backfill");

            return true;
        }

        Log::info("{$prefix}Found {$countToBackfill} {$table} records to backfill event_instance_id");

        if ($this->dryRun) {
            $stats['event_instance_ids_backfilled'] += $countToBackfill;

            return true;
        }

        // Chunk the UPDATE to avoid holding row-level locks on the entire table,
        // which would spike WAL generation and pin RDS Proxy connections on Lambda.
        // Each batch updates up to 1000 rows in a short-lived transaction.
        $totalBackfilled = 0;

        do {
            // Check timeout between batches
            if ($this->isApproachingTimeout()) {
                $stats['event_instance_ids_backfilled'] += $totalBackfilled;
                Log::warning("{$prefix}Phase 3 pausing during '{$table}' backfill — {$totalBackfilled}/{$countToBackfill} records done for this table, {$stats['event_instance_ids_backfilled']} total backfilled");
                $this->dispatchContinuation(3, $stats);

                return false;
            }

            $count = DB::affectingStatement("
                UPDATE {$table}
                SET event_instance_id = event_instances.id
                FROM event_instances
                WHERE {$table}.event_id = event_instances.event_id
                AND {$table}.pulse_id = event_instances.pulse_id
                AND event_instances.deleted_at IS NULL
                AND {$table}.event_instance_id IS NULL
                AND {$table}.event_id IS NOT NULL
                AND {$table}.pulse_id IS NOT NULL
                AND {$table}.id IN (
                    SELECT t.id FROM {$table} AS t
                    WHERE t.event_instance_id IS NULL
                    AND t.event_id IS NOT NULL
                    AND t.pulse_id IS NOT NULL
                    LIMIT 1000
                )
            ");

            $totalBackfilled += $count;

            if ($count > 0) {
                Log::info("{$prefix}Backfilled {$count} {$table} records in this batch ({$totalBackfilled}/{$countToBackfill} total so far)");
            }
        } while ($count > 0);

        $stats['event_instance_ids_backfilled'] += $totalBackfilled;

        Log::info("{$prefix}Backfilled event_instance_id on {$totalBackfilled} {$table} records");

        return true;
    }

    /**
     * Step 4: Delete orphaned future events (March 31, 2026 onwards) that have no child records.
     *
     * Targets events with date >= 2026-03-31 that do NOT have any:
     * - meeting_sessions (via event_id)
     * - agendas (via event_id)
     * - checklists (via event_id)
     * - actionables (via event_id)
     * - meetings (via event_id)
     * - event_meeting_session pivot (via event_id)
     * - event_instances with child records (meeting_sessions, agendas, checklists,
     *   or actionables linked via event_instance_id)
     *
     * Also cleans up associated event_instances, event_owners, event_meeting_session pivot,
     * meetings, and attendees for the deleted events.
     *
     * Phase 4 is idempotent — the query only selects orphaned events, so
     * already-deleted events will not reappear on a resumed run.
     *
     * @param  array<string, int>  &$stats  Mutable stats array to track progress.
     * @return bool  True if phase completed, false if a continuation was dispatched.
     */
    private function deleteOrphanedFutureEvents(array &$stats): bool
    {
        $phaseStart = microtime(true);
        $prefix  = $this->dryRun ? '[DRY RUN] ' : '';
        $cutoff  = '2026-03-31 00:00:00';

        Log::info("{$prefix}=== Phase 4/4: Delete Orphaned Future Events ===");

        // Build the base query for orphaned future events (no child records)
        $orphanedQuery = $this->buildOrphanedFutureEventsQuery($cutoff);

        if ($this->dryRun) {
            $count = (clone $orphanedQuery)->count();

            if ($count === 0) {
                Log::info("{$prefix}No orphaned future events found to delete");
                $elapsed = round(microtime(true) - $phaseStart, 1);
                Log::info("{$prefix}=== Phase 4 complete in {$elapsed}s: 0 events deleted ===");

                return true;
            }

            Log::info("{$prefix}Found {$count} orphaned future events (March 31, 2026+) to delete");
            $stats['orphaned_future_events_deleted'] += $count;

            $elapsed = round(microtime(true) - $phaseStart, 1);
            Log::info("{$prefix}=== Phase 4 complete in {$elapsed}s: {$count} events would be deleted ===");

            return true;
        }

        // Count upfront for progress reporting
        $totalOrphaned = (clone $orphanedQuery)->count();
        Log::info("{$prefix}Found {$totalOrphaned} orphaned future events (March 31, 2026+) to delete");

        // Use chunkById to paginate at the DB level — avoids loading all IDs into memory.
        // Critical for Lambda's limited memory (128MB-3GB).
        $eventMorphClass = $this->getEventMorphClass();
        $totalDeleted = 0;
        $timedOut = false;

        $orphanedQuery->chunkById(200, function ($events) use ($eventMorphClass, &$totalDeleted, $prefix, $totalOrphaned, &$timedOut, &$stats) {
            // Check timeout before processing the next chunk
            if ($this->isApproachingTimeout()) {
                $timedOut = true;

                return false; // Stop chunking
            }

            $ids = $events->pluck('id')->toArray();

            DB::transaction(function () use ($ids, $eventMorphClass) {
                // Clean up associated records.
                // Defensive deletes for meeting_sessions, agendas, checklists, actionables:
                // These should not exist (filtered by NOT EXISTS in the query), but guard
                // against race conditions to prevent FK constraint violations.
                DB::table('meeting_sessions')->whereIn('event_id', $ids)->delete();
                DB::table('agendas')->whereIn('event_id', $ids)->delete();
                DB::table('checklists')->whereIn('event_id', $ids)->delete();
                DB::table('actionables')->whereIn('event_id', $ids)->delete();
                DB::table('event_instances')->whereIn('event_id', $ids)->delete();
                DB::table('event_owners')->whereIn('event_id', $ids)->delete();
                DB::table('event_meeting_session')->whereIn('event_id', $ids)->delete();
                DB::table('meetings')->whereIn('event_id', $ids)->delete();
                DB::table('attendees')
                    ->where('entity_type', $eventMorphClass)
                    ->whereIn('entity_id', $ids)
                    ->delete();

                // Hard-delete the orphaned events
                DB::table('events')->whereIn('id', $ids)->delete();
            });

            $totalDeleted += count($ids);

            if ($totalDeleted % 1000 === 0 || $totalDeleted === count($ids)) {
                $pct = $totalOrphaned > 0 ? round(($totalDeleted / $totalOrphaned) * 100, 1) : 0;
                Log::info("{$prefix}Phase 4 progress: {$totalDeleted}/{$totalOrphaned} ({$pct}%) orphaned events deleted");
            }
        });

        $stats['orphaned_future_events_deleted'] += $totalDeleted;

        // If we stopped due to timeout, dispatch continuation from Phase 4
        if ($timedOut) {
            Log::warning("{$prefix}Phase 4 pausing — {$totalDeleted}/{$totalOrphaned} orphaned events deleted so far");
            $this->dispatchContinuation(4, $stats);

            return false;
        }

        $elapsed = round(microtime(true) - $phaseStart, 1);
        if ($totalDeleted === 0) {
            Log::info("{$prefix}=== Phase 4 complete in {$elapsed}s: 0 events deleted ===");
        } else {
            Log::info("{$prefix}=== Phase 4 complete in {$elapsed}s: {$totalDeleted} orphaned events deleted ===");
        }

        return true;
    }

    /**
     * Build the query for orphaned future events with no child records.
     *
     * Extracted to avoid duplicating the complex NOT EXISTS subqueries
     * between dry-run count and chunkById execution paths.
     *
     * @param  string  $cutoff  The date cutoff (events >= this date).
     * @return \Illuminate\Database\Query\Builder
     */
    private function buildOrphanedFutureEventsQuery(string $cutoff): \Illuminate\Database\Query\Builder
    {
        return DB::table('events')
            ->where('date', '>=', $cutoff)
            // No direct child records via event_id
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('meeting_sessions')
                    ->whereColumn('meeting_sessions.event_id', 'events.id');
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('agendas')
                    ->whereColumn('agendas.event_id', 'events.id');
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('checklists')
                    ->whereColumn('checklists.event_id', 'events.id');
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('actionables')
                    ->whereColumn('actionables.event_id', 'events.id');
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('meetings')
                    ->whereColumn('meetings.event_id', 'events.id');
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('event_meeting_session')
                    ->whereColumn('event_meeting_session.event_id', 'events.id');
            })
            // No indirect child records via event_instances' event_instance_id.
            // Without this check, agendas/checklists would be silently cascade-deleted
            // (FK onDelete cascade) and meeting_sessions/actionables would be orphaned
            // (FK onDelete set null) when the event_instances are deleted.
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('event_instances')
                    ->whereColumn('event_instances.event_id', 'events.id')
                    ->where(function ($q) {
                        $q->whereExists(function ($sub) {
                            $sub->select(DB::raw(1))
                                ->from('meeting_sessions')
                                ->whereColumn('meeting_sessions.event_instance_id', 'event_instances.id');
                        })
                        ->orWhereExists(function ($sub) {
                            $sub->select(DB::raw(1))
                                ->from('agendas')
                                ->whereColumn('agendas.event_instance_id', 'event_instances.id');
                        })
                        ->orWhereExists(function ($sub) {
                            $sub->select(DB::raw(1))
                                ->from('checklists')
                                ->whereColumn('checklists.event_instance_id', 'event_instances.id');
                        })
                        ->orWhereExists(function ($sub) {
                            $sub->select(DB::raw(1))
                                ->from('actionables')
                                ->whereColumn('actionables.event_instance_id', 'event_instances.id');
                        });
                    });
            })
            ->orderBy('id');
    }
}
