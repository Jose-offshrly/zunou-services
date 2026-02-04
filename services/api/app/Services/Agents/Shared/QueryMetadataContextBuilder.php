<?php

namespace App\Services\Agents\Shared;

use App\Models\LiveInsightOutbox;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Model;
use NumberFormatter;

class QueryMetadataContextBuilder
{
    public static function buildTopicPrompt(string $topicId): string
    {
        $topic = Topic::find($topicId);
        if ($topic->reference) {
            switch (true) {
                case $topic->reference instanceof LiveInsightOutbox:
                    return self::buildPromptForTopicSource($topic->reference, $topic);
                
                default:
                    // pass
                    break;
            }
        }

        $default = "This is a topic that the user has created and may or may not have a data source associated with it. Ask the user for more information if needed. Do not make up any information.";
        return sprintf(<<<'EOD'
            This conversation is centered on the following topic:

            **Topic Name:** "%s"
            **Topic Context:** "%s"
        EOD,
        $topic->name,
        $default);
    }

    private static function formatRecommendationsCount(int $count): string
    {
        $formatter = new NumberFormatter('en', NumberFormatter::SPELLOUT);
        $word = $formatter->format($count);
        return "{$word}({$count})";
    }

    private static function buildPromptForTopicSource(Model $model, Topic $topic): string
    {
        switch (true) {
            case $model instanceof LiveInsightOutbox:
                $insightTitle = $model->topic;
                $meeting = $model->meeting;
                $meetingTitle = $meeting->title ?? 'Unknown meeting';
                $meetingDate = $meeting->date ?? 'Unknown date';

                $insightData = json_encode([
                    'type' => $model->type,
                    'topic' => $model->topic,
                    'description' => $model->description,
                    'explanation' => $model->explanation,
                ], JSON_PRETTY_PRINT);

                $recommendationsCount = self::formatRecommendationsCount($model->recommendations->count());
                $recommendations = json_encode($model->recommendations->makeHidden('pivot'), JSON_PRETTY_PRINT);

                return sprintf(<<<'EOD'
                    This conversation is centered on the following topic %s which is also the name of the thread.
                   
                    This topic is created based on the insight below, Refer to this insight to have context about the topic.

                    **Insight Title:** "%s"

                    **Insight Details:**
                    ```json
                    %s
                    ```

                    This insight was generated from the meeting **"%s"** held on **%s**.  
                    Refer to it's meeting transcript if additional context or evidence is needed.

                    This insight also has %s recommendation action for the user to take next within the system.
                    ```json
                    %s
                    ```

                    "is_executed": bool (true if the recommendation has been executed by the user, false otherwise)
                    "execution_result": string (the result confirmation message of the execution, null if not executed yet)

                    ---

                EOD,
                $topic->name,
                $insightTitle,
                $insightData,
                $meetingTitle,
                $meetingDate,
                $recommendationsCount,
                $recommendations);

            default:
                return "This topic is related to a generic entity.";
        }
    }

}