<?php

namespace App\Services;

use Carbon\Carbon;

class ActivityLogMessageProcessor
{
    /**
     * Process messages and inject activity logs at appropriate positions
     * 
     * @param array $messages Array of processed messages
     * @param array $activityLogs Array of activity log objects
     * @return array Merged messages with activity logs injected
     */
    public function processMessagesWithActivityLogs($messages, $activityLogs)
    {
        $mergedMessages = [];
        $activityIndex = 0;
        $i = 0;
        $count = count($messages);
        
        // First, handle activities that occur before the first user message
        if ($count > 0) {
            $firstUserMessageIndex = null;
            for ($j = 0; $j < $count; $j++) {
                if ($messages[$j]['role'] === 'user') {
                    $firstUserMessageIndex = $j;
                    break;
                }
            }
            
            if ($firstUserMessageIndex !== null) {
                $firstUserTime = Carbon::parse($messages[$firstUserMessageIndex]['created_at']);
                
                // Insert activities that occur before the first user message
                $activitiesBeforeFirstUser = [];
                $tempActivityIndex = $activityIndex;
                while ($tempActivityIndex < count($activityLogs)) {
                    $activity = $activityLogs[$tempActivityIndex];
                    $activityTime = Carbon::parse($activity['created_at']);
                    if ($activityTime->lt($firstUserTime)) {
                        $activitiesBeforeFirstUser[] = $activity;
                        $tempActivityIndex++;
                    } else {
                        break;
                    }
                }
                
                if (!empty($activitiesBeforeFirstUser)) {
                    usort($activitiesBeforeFirstUser, function($a, $b) {
                        $timeA = Carbon::parse($a['created_at']);
                        $timeB = Carbon::parse($b['created_at']);
                        if ($timeA->lt($timeB)) return -1;
                        if ($timeA->gt($timeB)) return 1;
                        return 0;
                    });
                    foreach ($activitiesBeforeFirstUser as $activity) {
                        $mergedMessages[] = $this->createActivitySystemMessage($activity);
                    }
                    $activityIndex = $tempActivityIndex;
                }
            }
        }

        /**
         * Find the message with role "user" and the next message with role "user", insert any activity logs in between them
         * Note: make sure order of assistant & tool call are maintained to avoid openai errors
         */
        while ($i < $count) {
            $currentMessage = $messages[$i];
            if ($currentMessage['role'] === 'user') {
                $currentUserTime = Carbon::parse($currentMessage['created_at']);
                // Find the next user message index
                $nextUserIndex = null;
                for ($j = $i + 1; $j < $count; $j++) {
                    if ($messages[$j]['role'] === 'user') {
                        $nextUserIndex = $j;
                        break;
                    }
                }
                $nextUserTime = $nextUserIndex !== null ? Carbon::parse($messages[$nextUserIndex]['created_at']) : null;
                // Collect all messages in this segment
                $segmentEnd = $nextUserIndex !== null ? $nextUserIndex : $count;
                for ($k = $i; $k < $segmentEnd; $k++) {
                    $mergedMessages[] = $messages[$k];
                }
                // Insert activities after the segment
                $activitiesToInsert = [];
                $tempActivityIndex = $activityIndex;
                while ($tempActivityIndex < count($activityLogs)) {
                    $activity = $activityLogs[$tempActivityIndex];
                    $activityTime = Carbon::parse($activity['created_at']);
                    if ($activityTime->gt($currentUserTime) && (!$nextUserTime || $activityTime->lt($nextUserTime))) {
                        $activitiesToInsert[] = $activity;
                        $tempActivityIndex++;
                    } else if ($nextUserTime && $activityTime->gte($nextUserTime)) {
                        break;
                    } else {
                        $tempActivityIndex++;
                    }
                }
                if (!empty($activitiesToInsert)) {
                    usort($activitiesToInsert, function($a, $b) {
                        $timeA = Carbon::parse($a['created_at']);
                        $timeB = Carbon::parse($b['created_at']);
                        if ($timeA->lt($timeB)) return -1;
                        if ($timeA->gt($timeB)) return 1;
                        return 0;
                    });
                    foreach ($activitiesToInsert as $activity) {
                        $mergedMessages[] = $this->createActivitySystemMessage($activity);
                    }
                    $activityIndex = $tempActivityIndex;
                }
                $i = $segmentEnd;
            } else {
                $mergedMessages[] = $currentMessage;
                $i++;
            }
        }
        // Insert any remaining activities at the end
        while ($activityIndex < count($activityLogs)) {
            $mergedMessages[] = $this->createActivitySystemMessage($activityLogs[$activityIndex]);
            $activityIndex++;
        }
        return $mergedMessages;
    }

    /**
     * Create a system message from activity log
     */
    private function createActivitySystemMessage($activity)
    {
        // Validate activity has required properties
        if (!isset($activity['causer']) || !isset($activity['description'])) {
            throw new \InvalidArgumentException('Activity must have causer and description');
        }
        
        return [
            'role' => 'system',
            'content' => $activity['description'],
            'tool_calls' => null,
            'tool_call_id' => null,
            'created_at' => $activity['created_at'],
            'updated_at' => $activity['updated_at'],
        ];
    }
} 