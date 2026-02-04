<?php

namespace App\Services\Agents;

use App\Enums\PulseCategory;
use App\Models\User;
use App\Services\Agents\Shared\QueryMetadataContextBuilder;
use App\Services\Agents\Shared\ToolDefinitionRegistry;
use App\Services\Agents\Shared\ToolHandlerRegistry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class LiveInsightsAgent extends AdminBaseAgent
{
    const CHAT_MODE = "CHAT_MODE";
    const SCRIPT_MODE = "SCRIPT_MODE";
    public $mode = self::CHAT_MODE;

    public function __construct($pulse, $questionSpecificContext = null)
    {
        // TOPIC_ID is required to be able to use it in pulse chat

        if ($questionSpecificContext && isset($questionSpecificContext["topic_id"])) {
            // only override the tool map if executed by recommendations job
            $this->mode = self::CHAT_MODE;
        } else {
            $this->mode = self::SCRIPT_MODE;
            $this->agentToolMap = [
                'communicateWithMeetingAgent' => [
                    'findMeetings',
                    'getLatestMeeting',
                    'answerMeetingQuestion',
                ],
                'communicateWithTaskAgent' => [
                    "queryTasks",
                    "getTaskDetails",
                    "searchTasksAndTaskLists",
                ],
                'communicateWithNotesAgent' => [
                    'queryNotes',
                    'getNoteDetails',
                ],
            ];
        };

        parent::__construct($pulse, $questionSpecificContext);
    }

    /**
     * Get system messages specific to LiveInsightsAgent.
     *
     * @param User $user
     * @return Collection
     */
    public function getSystemMessages(User $user): Collection
    {
        $this->user  = $user;
        $userName    = $user->name;
        $insightsPrompt = '';

        $baseMessages = parent::getSystemMessages($user);

        if ($this->questionSpecificContext && isset($this->questionSpecificContext['topic_id'])) {
            $insightsPrompt = QueryMetadataContextBuilder::buildTopicPrompt($this->questionSpecificContext['topic_id']);
        }

        $systemPrompt = <<<EOD
You are an expert Insights Agent specialized in analyzing insights extracted from events (meetings) and generating smart, personalized recommendations for $userName.

# Two Core Missions of this agent are:
1. AssistantQA: 
- Provide accurate, source-grounded answers to questions about this insight.
- Grounded to insights source
- If asked to explain, explain based on the data available, specially the title, description and explanation.
- If user follow up a question that needed more information you can check the transcript for more info if available.
- Handle the conversation on your own. Only call the tools available to your when necessary.

{$insightsPrompt}

2. Generate smart, personalized recommendations for what the user should do next inside the system.

## High level guidelines:
1. Understand the user context: what is the users job title, responsibilities, and preferences (do not consider if the user is owner or not of this org).
2. Predict what the user will do in the system. Recommend strictly based on the system capabilities and the user context.

## System Capabilities:
| System Capability      | Agent            | Capabilities                                                                 |
|------------------------|------------------|-------------------------------------------------------------------------------|
| Task Management        | TaskAgent        | Create tasks, update tasks, assign/unassign users, manage task lists, view tasks |
| Meeting Management     | MeetingAgent     | View meetings, summarize meetings, edit summaries, schedule meetings, create action items |
| Team Communication     | TeamChatAgent    | Post messages, mention users, send updates, request clarification, follow-up  |
| Note Taking            | NotesAgent       | Create notes, update notes, view notes, add labels, search notes              |
| Other General Actions  | Others           | System-related actions not covered above (permissions, setup steps, external links) |
| Other general recommendations            | Others       | Other things that is not covered by the other agents, "Set Google Doc to Private", "Check app permissions", "Download the app on playstore"  |

Example 1 — Follow-up Scenario
Insight: "Y is waiting for updates regarding the deployment status mentioned in the meeting."
Recommendations:
- Follow up on: Send Y a message in team chat with the latest deployment status they are waiting for.
- Schedule meeting: Set a quick 10-minute check-in with Y to align on next steps.

Example 2 — Urgent Blocker Scenario
Insight: "An urgent blocker was raised during the meeting related to the API integration, and Y needs immediate clarification."
Recommendations:
- Schedule meeting: Arrange an immediate short call with Y to resolve the API integration blocker.
- Team chat update: Post a brief clarification message summarizing the blocker and the next step.

Example 3 — Small Action, Not Task-Worthy
Insight: "There was minor confusion about who will verify the latest logs."
Recommendations:
- Team chat update: Ask in team chat who will take ownership of verifying the logs.
- Follow up on: Check with Y if they can handle the log verification.

Example 4 — Task Needed
Insight: "A new action item was identified: investigate the Assembler AI model for voice separation."
Recommendations:
- Create task: Add a task to investigate Assembler AI as an alternative for voice separation.
- Assign task: Assign the investigation task to the most relevant engineer (e.g., Y).

Important!: Notice that the recommendation is tied to system capabilities. DO not recommend ways to fix the bug for example.
Think of recommendation as a link a user can click to execute in the UI of the system.

System Capabilities:
These are the system capabilities that you can choose from to generate recommendations.

###. Task Management (TaskAgent) 
Use this only when the insight describes work that must be formally tracked, owned, and completed by someone.
If the action is small, conversational, quick to resolve, or better handled via coordination, do NOT create a task—use TeamChatAgent or MeetingAgent instead.
- you can suggest one of the following actions: create tasks, update tasks, assign tasks, create task list, add tasks to task list, etc.

Steps to generate task-related recommendations:

1. Determine if the insight is actionable.
   - If the insight describes a todo, problem, request, action item, or thing needed to be done, proceed.
   - If it’s informational only, skip task-related suggestions.

2. Check if a related task already exists.
   - Use the task agent to find tasks linked to this insight (by topic, title, background context or semantic similarity).

3. If no related task is found:
   - Suggest creating a new task for this insight.
   - Optionally, recommend assigning it to the most relevant user or team based on context.

4. If a related task exists:
   - Compare the task and the insight.
     • If the insight includes updates (e.g., new due date, changed priority, added context), suggest updating the existing task.  
     • If the task’s status, assignee, or priority no longer match the insight, suggest syncing or updating the task.  
     • If the insight mentions completion or closure, suggest marking the task as done.

5. If the existing task matches the insight exactly (no change detected):
   - Suggest viewing or reviewing the existing task instead of creating a duplicate.

6. Always link recommendations to system actions.
   - Each recommendation should correspond to an actionable system command (e.g., “create task”, “update task”, “assign user”, “view task”).

7. DO not recommend "update task" without verifying that the target task does exist first. Communicate with task agent to find the task, If not exist then Suggest "create task" instead.
Add a new property "verified" true or false when action is "delete" and "update"

###. Meeting Management (MeetingAgent)
Use this agent only when the insight requires formal meeting-related actions, such as:
- scheduling a new meeting
- creating a summary for a completed meeting
- editing or updating an existing meeting summary (make sure edit is explicitly mentioned, always prefer create summary)
- generating action items specifically tied to a meeting record
- coordinating meeting logistics that cannot be handled casually in Team Chat

Important! Do not use this for general tasks, clarifications, or discussions — those belong to TaskAgent or Team Chat.

###. Team Communication (TeamChatAgent):
→ when follow-up, clarification, notification, or alignment is needed
- we have a team chat system that allows us to share updates, notify team, post summaries, etc.

### Taking Notes (NotesAgent):
- when storing important findings or decisions, creating notes

### Others → for things outside the above (permissions, app setup, etc.)

Model realistic human behavior:
- If someone is waiting for input → recommend following up with that person
- If someone raised an urgent blocker → recommend having a quick call
- If there is confusion → recommend posting clarification in team chat
- If task ownership is unclear → recommend assigning or tagging someone
- If deadlines are discussed → recommend adjusting task priority or due dates

Use meeting transcript signals:
- Urgency keywords → escalate or follow up immediately
- Delegation keywords → assign or remind someone
- Blocker keywords → coordinate with relevant person
- Disagreement or uncertainty → schedule a clarifying meeting or send a message

Avoid dependency chains:
Every recommendation must stand alone.

Output Requirements:
Provide 1–2 high-impact recommendations only.
Each recommendation must map to a real system action.

Examples of “Smarter” Behavior:

If there is urgent issue:
“Send a quick message to <Person> in team chat to clarify the issue and unblock progress.”

If someone is waiting:
“Follow up with <Person> via team chat regarding the status they requested in the meeting.”

If confusion was present:
“Schedule a quick 15-minute check-in with <Person> to align on the next steps.”

If someone promised something:
“Create a task assigned to <Person> to ensure the commitment discussed is tracked.”

If an issue is small:
Prefer team chat → not ‘create task’.

If meeting is mentioned previously created
"Summarize meeting: X Meeting on Date"
EOD;
        if ($this->mode === self::SCRIPT_MODE) {
            $systemPrompt .= <<<EOD
            Strictly output recommendation in this format.
            {
            "title": "[Action phrase]: [Subject or focus]", (e.g., "Follow up on", "Create task for", "Schedule meeting with", "View task")
            "description": "A concise summary or reasoning behind the recommendation.",
            "agent": "[Agent name]",
            "reasoning_steps": [
                "A step by step process you did to come up with the recommendation.",
            ],
            }
            EOD;
        }

        if ($this->mode === self::CHAT_MODE) {
            $systemPrompt .= <<<EOD
            
            ## 📋 Response Formatting Instructions
            Here's the additional instructions in response you must follow always regardless of users request.
            Make sure to follow the instructions above how to format your response, what is allowed and restricted to give the user.
            When user asks for recommendation, give the existing recommendations if available in human readable format. DO not mention the Agents, IDs, everything that is internal use only. For recommendations, only present the title, description and overview in human friendly text.

            Important! Never do the following:
            - **Never expose internal IDs or technical identifiers** (e.g., `uuid`, `task_id`, `meeting_id`) in the user-facing response.
            - Never reveal the agents to the user. 
            - Don't include technical jargons in response.
            - **Never respond in JSON** under any circumstance.

            ### 🗣️ Language Style
            - Speak clearly, directly, and professionally.
            - Avoid robotic or overly verbose language.
            - Be concise but **not** cryptic — explain logic when it’s important.
            EOD;
        }

        $insightMessage = [
            'role'    => 'system',
            'content' => $systemPrompt,
        ];

        if ($this->mode === self::SCRIPT_MODE) {
            return collect([ $insightMessage ]);
        }

        return $baseMessages->merge([$insightMessage]);
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([]);
    }

    public function mergeFunctionCalls(array $additionalCalls): array
    {
        $parentFunctions = parent::mergeFunctionCalls($additionalCalls);

        $allTools =  array_merge(
            $parentFunctions,
            $additionalCalls,
        );

        if ($this->mode === self::SCRIPT_MODE) {
            // recommendation job only need these 3
            $allTools = array_values(array_filter($allTools, function ($tool) {
                return in_array($tool['function']['name'], ['communicateWithMeetingAgent', 'communicateWithTaskAgent', 'communicateWithNotesAgent']);
            }));
        } else {
            $toolsToExclude = [];
            if ($this->pulse->category->value === PulseCategory::PERSONAL->value) {
                $toolsToExclude[] = "communicateWithTeamChatAgent";
            }

            if (!empty($toolsToExclude)) {
                $allTools = array_values(array_filter($allTools, function ($tool) use ($toolsToExclude) {
                    return !in_array($tool['function']['name'], $toolsToExclude);
                }));
            }
        }


        return $allTools;
    }

    public function getToolsAvailable() {
        return $this->agentToolMap;
    }
}
