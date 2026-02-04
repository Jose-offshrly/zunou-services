<?php

namespace App\Services;

use App\Models\Automation;
use App\Schemas\AutomationSchema;
use App\Schemas\StrategySchema;
use App\Services\Agents\Helpers\AgentConfig;
use Illuminate\Support\Carbon;

class StrategyService
{
    /**
     * Generate a structured title and description from mission text using OpenAI.
     *
     * @param string $missionText The free-text mission input from the user.
     * @return array{title: string, description: string} The extracted mission metadata.
     *
     * Example response:
     * [
     *     'title' => 'Personal Career Coach',
     *     'description' => 'Guide the user in planning their next job move by assessing skills, exploring career options, and providing strategic advice.'
     * ]
     */
    public static function generateTitleAndDescriptionForMission(
        string $missionText,
    ): array {
        $prompt = <<<PROMPT
A pulse is a system that let's you communicate with an AI assistant to help with your business or company needs. A pulse can also store information like business documents and other important data. The AI agent can help you communicate to those documents by summarization, extraction, and other tasks.
A mission is the purpose of the pulse and is mostly related to company or business practices. A pulse can have many missions.
A mission can't be exploitative or illegal. It should be feasible.
A mission is composed of a title and description, and prompt description.

The description should be human-readable and explain what the mission aims to accomplish in high-level language that users can understand.

The prompt description should be technical and focus on on context-based responses, containing specific details about how the mission processes and understands context.

First, you must determine if the misssion is illegal. If it is illegal, set "isSuccess" to false, then both the "title", "description", and "prompt_description" fields should clearly indicate that the input is invalid due to these reasons.

If the mission is feasible, set "isSuccess" to true, then extract and populate the fields accordingly, but do not restructure the input.

Make sure the title, description, and prompt description are in English (even if the mission involves another language).
PROMPT;
        // If the mission input is valid, extract and populate these fields accordingly. However, if the mission input is not feasible, illegal, or not business related, then both the "title" and "description" fields should clearly indicate that the input is invalid due to these reasons.
        $openAI    = \OpenAI::client(config('zunou.openai.api_key'));
        $toolModel = AgentConfig::toolModel('automation', 'generateMission');
        $response  = $openAI->chat()->create([
            'model'    => $toolModel,
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
                [
                    'role'    => 'user',
                    'content' => "Extract a title, description, and prompt description from this mission:\n\n" .
                        $missionText,
                ],
            ],
            'response_format' => StrategySchema::EXTRACT_STRATEGY_META,
        ]);

        return json_decode($response['choices'][0]['message']['content'], true);
    }

    public static function generateTitleAndDescriptionForAutomation(
        string $freeText,
    ) {
        // Instantiate Automation model to retrieve available function calls.
        $automation        = new Automation();
        $functionCallsJson = json_encode($automation->getFunctionCalls());

        $prompt = <<<PROMPT
You are an assistant expert in providing detailed process on how to automate a certain goal.
You are working inside a group called Pulse, along with other pulse members including the current user.

Utilize the following available tools:
$functionCallsJson

User will enter a description of what he/she wants to automate. 
Your job is to utilize the tools to restructure the description by only using the available tools so that it can smoothly run in the automation.

All automations are scheduled to run at a specific time. The automation can be scheduled to run:
1. hourly

Use the available tools to generate:
1. A title for the automation
2. A description - a human-readable explanation of what the automation does in high-level language.
3. A prompt description - a technical description focused on tool-based response, with specific details about how the automation interacts with tools and processes in a step-by-step manner.

Follow the format, DO NOT provide a description of the tool, only the tool name and nothing else:

```
- Step 1: tool_name
- Step 2: tool_name
- Step 3: tool_name
...
- Step N: tool_name
```

Do not mention the function names in the description but mention the function names in the prompt description. Ensure that the output is specific on the steps to perform and that each step is interconnected.
Mention the automation frequency in both the description and prompt_description

If the automation cannot be accomplished even when restructured using the available tools, set "isSuccess" to false, title to "Automation Incomplete", and include a descriptive explanation why, along with "Please contact the admin if you think this is a mistake" in the description and prompt description.

Make sure that the title, description, and prompt description are in English (even if the automation involves another language).
PROMPT;

        $openAI    = \OpenAI::client(config('zunou.openai.api_key'));
        $toolModel = AgentConfig::toolModel('automation', 'generateAutomation');

        $response = $openAI->chat()->create([
            'model'    => $toolModel,
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
                [
                    'role'    => 'user',
                    'content' => "Extract a title, description, and hasRequiredTools from this automation:\n\n" .
                        $freeText,
                ],
            ],
            'response_format' => StrategySchema::EXTRACT_STRATEGY_META,
        ]);

        return json_decode($response['choices'][0]['message']['content'], true);
    }
    /**
     * Extract the automation type (daily, weekly, monthly, yearly), next run at (timestamp);
     */
    public static function extractAutomationType(string $description)
    {
        $prompt = <<<PROMPT
You are an scheduling assistant expert in determining the automation type and when will the next automation is run given the automation description.

There are only 5 automation types:
1. 'hourly' => This is for when the automation task is run hourly
2. 'daily' => This is for when the automation task is run daily
3. 'weekly' => This is for when the automation task is run weekly
4. 'monthly' => This is for when the automation task is run monthly
5. 'yearly' => This is for when the automation task is run yearly.

For determining when the next automation will be run, the format must follow the timestamp format that a database will understand.
If there is no date mentioned available, schedule the automation to run at the current time (already in utc) and default to hourly as the automation type.

Convert the timestamp (in Japan Time) to UTC.
Examples:
1. 2025-02-21 08:00:00 in Japan Time -> 2025-02-20 23:00:00 in UTC Time
2. 2025-02-22 15:00:00 in Japan Time -> 2025-02-22 08:00:00 in UTC Time

Ensure that you record the time that is in UTC timezone.
PROMPT;
        $currentDateTime = Carbon::now()->toDateTimeString();

        $openAI    = \OpenAI::client(config('zunou.openai.api_key'));
        $toolModel = AgentConfig::toolModel('automation', 'generateAutomation');
        $response  = $openAI->chat()->create([
            'model'    => $toolModel,
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
                [
                    'role'    => 'user',
                    'content' => "Extract the automation type and when the automation will next run at from this description\n\n" .
                        $description .
                        "\n\n The current date time in UTC is " .
                        $currentDateTime,
                ],
            ],
            'response_format' => AutomationSchema::EXTRACT_TYPE_SCHEDULE,
        ]);

        return json_decode($response['choices'][0]['message']['content'], true);
    }
}
