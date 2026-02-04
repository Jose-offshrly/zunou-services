<?php

namespace App\Jobs;

use App\Models\Summary;
use App\Services\Agents\Shared\TaskPipeline;
use App\Services\VectorDBService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class PostProcessSummaryJob implements ShouldQueue
{
    use Queueable;

    protected string $summaryId;
    protected string $organizationId;
    protected string $pulseId;
    /**
     * Create a new job instance.
     */
    public function __construct(string $summaryId, string $organizationId, string $pulseId)
    {
        $this->summaryId = $summaryId;
        $this->organizationId = $organizationId;
        $this->pulseId = $pulseId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $summary = Summary::find($this->summaryId);
        if (!$summary) {
            throw new \Exception('Summary not found');
        }

        $pipeline = new TaskPipeline($this->organizationId, $this->pulseId);

        $actionItems = json_decode($summary->action_items, true);

        $newTasks       = [];
        $duplicateTasks = [];

        $taskTitleAndDescriptions = array_map(function ($task) {
            return $task['title'] . ' ' . ($task['description'] ?? '');
        }, $actionItems);
        $embeddings = VectorDBService::getEmbeddings($taskTitleAndDescriptions);
        $allSimilarMatches = $pipeline->batchSearchForDuplicates(
            $embeddings,
            $this->organizationId,
            "tasks:{$this->pulseId}",
        );

        $taskNumber = 1;
        foreach ($actionItems as $index => $task) {
            $task['task_number'] = $taskNumber;
            $taskNumber++;

            $matches = $allSimilarMatches[$index];

            if (! empty($matches)) {
                $duplicateTasks[$task['task_number']] = [
                    ...$task,
                    'matches' => $matches,
                ];
                continue;
            }

            $newTasks[] = $task;
        }

        if (empty($duplicateTasks)) {
            dump("No duplicate tasks found");
            return;
        }

        $result = $pipeline->checkSimilarityByAI($duplicateTasks);

        foreach ($result as $taskEval) {
            $taskItem = $duplicateTasks[$taskEval['task_number']];
            if ($taskEval['is_duplicate']) {

                $duplicateTasks[$taskEval['task_number']]['matches'] = collect($duplicateTasks[$taskEval['task_number']]['matches'])->values()->map(function($match) {
                    $metadata = $match['metadata'];
                    $metadata['id'] = $metadata['task_id'];
                    return $metadata;
                });
                unset($duplicateTasks[$taskEval['task_number']]['task_number']);
            } else {
                $newTasks[] = $taskItem;
                unset($taskEval);
            }
        }
        
        $duplicatedTasks = collect($duplicateTasks)
            ->map(function ($task) {
                $task['is_existing'] = true;
                unset($task['matches']);
                return $task;
            })
            ->values()
            ->all();

        $tasks = array_merge($newTasks, $duplicatedTasks);

        $statusMapping = [
            'TODO'       => 'Not Started',
            'INPROGRESS' => 'In Progress',
            'COMPLETED'  => 'Done',
        ];

        $priorityMapping = [
            'LOW'    => 'Low',
            'MEDIUM' => 'Medium',
            'HIGH'   => 'High',
            'URGENT' => 'Urgent',
        ];

        $tasks = array_map(function ($task) use (
            $statusMapping,
            $priorityMapping
        ) {
            $rawStatus      = $task['status']            ?? null;
            $task['status'] = $statusMapping[$rawStatus] ?? 'Not Started';

            $rawPriority      = $task['priority']              ?? null;
            $task['priority'] = $priorityMapping[$rawPriority] ?? 'Low';

            return $task;
        }, $tasks);

        $summary->action_items = json_encode($tasks);
        $summary->save();

        Log::info('Summary action items updated', ['summary_id' => $this->summaryId]);
    }
}
