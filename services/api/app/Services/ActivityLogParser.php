<?php 

namespace App\Services;

use App\Models\Activity;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class ActivityLogParser
{
    private User $user;
    private string $pulseId;
    
    public function __construct(User $user, string $pulseId)
    {
        $this->user = $user;
        $this->pulseId = $pulseId;
    }
    
    /**
     * Parse activity logs.
     *
     * @param  array|null  $subjectTypes  Fully-qualified model class (e.g., App\Models\Task::class)
     * @param  string|null  $from         Date in 'Y-m-d' or full datetime format
     * @param  string|null  $to           Date in 'Y-m-d' or full datetime format
     * @return Collection
     */
    public function parse(?array $subjectTypes = null, ?string $from = null, ?string $to = null)
    {
        $allSubjectTypes = [
            Task::class,
            Meeting::class,
            DataSource::class,
            User::class,
        ];
        
        // Skip whereHas('subject') here - it generates slow EXISTS subqueries.
        // We'll filter out deleted subjects after the query instead.
        $query = Activity::with(['causer' => function ($query) {
                $query->select('id', 'name');
            }, 'subject'])
            ->whereIn("subject_type", $subjectTypes ?? $allSubjectTypes)
            ->where("causer_type", User::class)
            ->where('pulse_id', $this->pulseId)
            ->whereNotNull('subject_id')
            ->orderBy('created_at', 'asc')
            ->select('id', 'causer_id', 'causer_type', 'description', 'created_at', 'updated_at', 'subject_id', 'subject_type');

        if ($from) {
            $query->where('created_at', '>=', Carbon::parse($from));
        }

        if ($to) {
            $query->where('created_at', '<=', Carbon::parse($to));
        }

        $activityLogs = $query->get();
        
        // Remove activities with deleted subjects, reindex for ActivityLogMessageProcessor
        return $activityLogs
            ->filter(fn ($activityLog) => $activityLog->subject !== null)
            ->values()
            ->map(function ($activityLog) {
                $date = Carbon::parse($activityLog->created_at)->tz($this->user->timezone);
                $activityLog->description = "[$date] @{$activityLog->causer->name}: {$activityLog->description}";
                return $activityLog;
            });
    }
}