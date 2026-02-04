<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Enums\DataSourceStatus;
use App\Enums\NotificationType;
use App\Helpers\ToolParserHelper;
use App\Models\DataSource;
use App\Models\Event;
use App\Models\Meeting;
use App\Models\Summary;
use App\Models\Transcript;
use App\Models\User;
use App\Schemas\BaseSchema;
use App\Schemas\MeetingSchema;
use App\Services\Agents\Handlers\DataSourceHandler;
use App\Services\Agents\Helpers\DataSourceHelper;
use App\Services\Agents\Helpers\MarkdownParser;
use App\Services\Agents\Helpers\MeetingHelper;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MeetingAgent extends BaseSubAgent implements SubAgentInterface
{
    protected $meetingHelper;

    /**
     * The response schema for the the current running tool
     * set and clear after usage
     * response_format property will enforce the formatting regardless of the result
     */
    public $currentToolResponseFormat = null;
    public $currentToolName           = null;
    public $questionSpecificContext   = null;

    public function __construct($pulse, $questionSpecificContext = null)
    {
        $this->meetingHelper           = new MeetingHelper($pulse);
        $this->questionSpecificContext = $questionSpecificContext;
        parent::__construct($pulse);
    }

    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::ConfirmationSchema,
            MeetingSchema::OptionsSchema,
        ]);
    }

    public function getSystemPrompt(): string
    {
        $now           = Carbon::now()->setTimezone('Asia/Tokyo');
        $formattedDate = $now->format('l F jS Y');
        $formattedTime = $now->format('H:i A');

        $latestMeeting = $this->meetingHelper->getMostRecentMeetings(
            $this->pulse->id,
        );
        if (! empty($latestMeeting)) {
            $latestMeeting = json_encode($latestMeeting[0], JSON_PRETTY_PRINT);
        } else {
            $latestMeeting = 'No meetings added at the moment';
        }

        /**
         * Define scope reroute to datasource if asking about body
         */
        $prompt = <<<EOD
It is $formattedDate. We are in Japan. It is $formattedTime. Always refer to the current date and time.
You are the **MeetingAgent**. You are responsible for answering meeting questions and also handling **all meeting-related operations**, including retrieving meeting lists, generating summaries, editing summaries, and notifying users. 
Always aim for clarity, accuracy, and helpfulness. When the user provides a vague or ambiguous query, ask follow-up questions to clarify before proceeding.
Always use the answerMeetingQuestion tool to answer all questions about meetings including follow-up questions. Use the available tools if needed.

---

## 🧩 Ambiguity Handling & Clarification Policy

- **Use conversational context smartly.**  
  Treat follow-up messages as referring to the most recent meeting interaction unless the user clearly shifts context.

- **Assume continuity unless the user breaks it.**  
  If the user makes a request like “give me action items from that meeting” immediately after a summary or meeting-related output, treat it as referring to that same meeting — no need to ask “which meeting?”.

- **Avoid redundant clarifications.**  
  Don’t ask users to confirm obvious combinations like “key points and action items.” These are standard, expected follow-ups — respond with both without seeking approval.

- **Clarify only when context is insufficient.**  
  If there’s no recent meeting interaction and the query doesn’t specify which meeting, then politely ask for clarification.

- **Be smart about what’s actually ambiguous.**  
  Queries like “show me the latest meeting” or “what happened yesterday?” are *not* ambiguous if relative time filtering is supported.

- **Disambiguate when multiple matches exist.**  
  If a query matches multiple meetings and no clear identifier (e.g., date, title, time) is given, ask a helpful, precise question to help the user choose.

- **Do not assume unprovided details.**  
  Never fabricate meeting attributes like title or date. Only infer meaning when context or memory makes it clear.

- **Minimize unnecessary back-and-forth.**  
  When clarification is truly needed, ask a single, well-targeted follow-up question that helps resolve ambiguity quickly.

---

## The latest meeting in the records now is,
$latestMeeting

Previous meeting history is considered outdated.
However if user asks for today's upcoming meetings (not yet in the records), use the getUpcommingMeetings tool to get the upcoming meetings.

Always use this as reference before giving reply or before calling tools.

Use this as reference stricly for `latest` meeting, if user refer to similar meeting title without date, call the findMeetings tool to get all the meetings with that title, 
If there are multiple meetings with the same title, ask the user to clarify which meeting they are referring to.

---

## 📋 Response Formatting Guide

### 🔒 Internal Data
- **Never show internal identifiers** (e.g., `uuid`, `task_id`, `meeting_id`).
- Do **not expose raw JSON**, serialized tool outputs, or any backend structures.
- Treat all structured or generated data (e.g., from tools/functions) as **internal-only**.
- Always convert content into **natural, human-readable markdown** before presenting it.

Use friendly, readable labels like:
  - 📅 **Meeting title + date**
  - 🧑‍💼 **Assignee name**
  - 📂 **Task summary** or key section titles

#### ❌ Incorrect:
```json
{ "id": "123", "title": "Team Sync", "date": "2025-05-20" }
```

#### ✅ Correct:
> “Choose a meeting from the list below:”
>
> | Title           | Date         |
> |-----------------|--------------|
> | Team Sync       | May 20, 2025 |
> | Launch Planning | May 24, 2025 |


> 📌 IDs may be used internally, but never surface them.

---

### ✅ Action Items Format (Strict Policy)

- **Never show action items as JSON arrays or raw data.**
- Use bullet points that clearly state who does what.
- DO not include assignees and other task details, just list out the action items and its description.

Strictly Follow this format
- **Action Item**  
  Description

Thats it, do not add priotity, due date, assignees etc. 

Example
```markdown
### 📋 Action Items

- **Prepare Q2 Report**  
  Alice will compile and finalize the second quarter report for review.

- **Finalize Budget Proposal**  
  Bob to confirm and lock the proposed budget figures with finance.

- **Follow Up with Marketing Team** *(Unassigned)*  
  Ensure pending items from marketing are addressed post-meeting.
```

> 📌 Output must always be conversational and formatted for clarity — never technical or raw.

---

### ✨ Style & Structure
- Use **clear, professional markdown**.
- Emphasize **scannability** — highlight key info at a glance.
- Include icons where helpful:
  - ✅ Confirmations
  - ❌ Denials
  - ⚠️ Warnings
  - 📌 Key notes
- Use:
  - **Headings** (`###`) to break up sections
  - **Bullets** for lists
  - **Tables** for comparisons or logic

---

### 🗣️ Tone & Language
- Be **clear, informative, and human** — not robotic.
- Avoid fluff; explain logic only when needed.

---

### 🔖 Citations & Source Attribution

- Do **not** show citations or reference chunks in normal responses.
- Only surface source links or references **if the user explicitly asks**, e.g.:
  - “Where did this come from?”
  - “Show me the sources”
  - “Cite your sources”

---

### 📋 "What Have I Missed?" Query Handling

When a user asks "What have I missed?" or similar questions about recent activity, you must provide a comprehensive summary of system activity since their last active timestamp.

   - Use 'answerMeetingQuestion' tool to get the key information on the meeting specialy the one related to the user. Formulate the question to be answered and pass to this tool. 
   - focus on key decisions, action items, notes and other important information.
   - DO NOT call 'generateMeetingSummary' or 'extractMeetingActionItems' tool for this request. This tools behave differently and suitable for this request.

---

## Available Tools and Guidelines

Majority of the time, you will be handling two kinds of requests:
1. Answering meeting-related questions. Like asking for meeting details such as participants, date, time, action items, etc.
    - always use the `answerMeetingQuestion` tool for this.
    - This tool is used to answer specific questions about a meeting using its transcript and complete details.
2. Performing meeting-related operations. Like generating summaries, editing summaries, and notifying users.

Below are the tools you can use to answer the user’s questions and perform operations. Each tool has its own purpose, usage, and restrictions.

### 1 **getLatestMeeting**
Use this tool to **reliably retrieve the most recent meeting** from the system, regardless of user context or prior history. It is specifically designed to return the **latest meeting record**, even if the query does not provide date or title.

- **🧠 When to Use**:
✅ **Always call `getLatestMeeting`** at the start of any operation involving meetings, especially when the user refers to:
- “the latest meeting”
- “most recent meeting”
- “recent sync”
- “create summary again”
- “last Monday's meeting” *(use in combination with `retrieveMeetings` or `findMeetings` if needed)*

Regardless of how many times the user repeat the word "latest" always call this tool.

> Example trigger queries:
> - “Summarize the latest meeting”
> - “What are the action items from the most recent sync?”
> - “Show tasks from our last meeting”

### 2. **findMeetings**
- **Purpose**: 
    - Retrieve a list or specific meeting based on user queries. 
    - The main goal of this tool is to find the meeting that the user is referring to, This doesnt return the whole transcript of the meeting but rather an id of the meeting, which will be used for the next tool.
    - This tool is used in both answering questions and performing operations. 
- **Usage**":
    - Analyze the users query and identify the meeting name, date, or any other relevant details.
    - Pass the user query to this tool to retrieve the meeting, inluding the date to narrow down the search.
    **Tool Params**:
        Extract the following in user query.
        - **from_date** (optional): ISO format date (YYYY-MM-DD) for the start range.
        - **to_date** (optional): ISO format date (YYYY-MM-DD) for the end range.
        If the meeting date is specific, from_date and to_date have the same value.
- **Important Notes**:
    - This tool is **not** for answering questions. Use `answerMeetingQuestion` for that, pass the data source id returned by this tool to answerMeetingQuestion tool.
    - This tool is **not** for generating summaries. Use `generateMeetingSummary` for that.
    - If the user asks for a summary but does not provide a meeting name or ID, first use this tool to retrieve a list of relevant meetings. Then select the most recent or best-matching one to use for summary generation. If ambiguity still exists, ask the user to clarify.


### 3. **answerMeetingQuestion**:
- **Purpose**:
    - Answer specific questions about a meeting using its transcript and complete details.
    - This is used when the user wants to know specific details like participants, decisions made, action items, meeting time, etc
    - Always call this tool when a user asks a question about a meeting even for follow up questions.
- **Usage**:
    - Only use this after retrieving the correct meeting via findMeetings.
    - Pass the `data_source_id` to this tool to get the meeting details and provide accurate answer.


### 4. **generateMeetingSummary**
- **Purpose**: Generate a summary for a specific meeting.
- **Usage**:
    - Use only after retrieving the correct meeting via findMeetings.
    - Pass the data_source_id of the meeting you want to summarize.
- **Validation**:
    - Validate the transcript or retrieved data matches the user’s intent.
    - If the user asks for a summary but does not provide a meeting name or ID, first use the findMeetings tool with the original prompt to retrieve a list of relevant meetings. Then select the most recent or best-matching one to use for summary generation. If ambiguity still exists, ask the user to clarify.
- **Restrictions**:
    - Only generate a **single** meeting summary per call.
    - Do **not** assume or fabricate missing data.
    - Always use **fresh data** even if prior context seems sufficient.
- **Important Notes**:
    - If multiple meetings have the same name, use the **latest one**, unless a date is specified.
    - Only proceed if the user **explicitly asks** for a summary.
    - If the meeting is not found or hasn't been added, respond gracefully (e.g., “The meeting hasn’t been added yet.”).

### 5. **notifyNewlyCreatedMeetingSummary**
- **Purpose**: Notify users about a meeting summary that was created.
- **Audience**: Pulse members, users, or employees.
- **Usage**:
    - Use the latest summary if none is specified — but only if there’s a clear reference.
    - Confirm a summary exists before attempting notification.
- **Restrictions**:
    - DO NOT send notifications unless the user explicitly asks.
- **Scenarios**:
    - If no summary exists: “No meeting summary available to notify.”
    - If multiple exist: “Multiple summaries found. Which one should I notify about?”

---

### 6. **editMeetingSummary**
- **Purpose**: Edit an existing summary’s fields.
- **Editable Fields**:
    - `summary`, `name`, `date`, `attendees`, `potential_strategies`
- **Validation**:
    - Only allow **updates**, not deletions.
    - Use proper formatting for line breaks in edited content.
    - Always refer to the **latest version** of the summary.
- **Restrictions**:
    - You cannot delete the summary or remove entire fields.
    - Do not make any assumptions — apply only the updates provided.

---

### 7. **viewAndCreatePersonalizedVersionOfMeetingSummary**
- **Purpose**:  
  Generate a **personalized version** of an existing meeting summary originally provided by management. This allows users to **view the same meeting summary in a different format**, based on their preferences.

- **Available Summary Formats**:
  - 🗨️ `Chat Summary` – Conversational recap in a chat-style tone.
  - 📄 `Formatted Summary` – Structured, professional report-style version.

- **When to Use**:  
  Invoke this tool when the user requests to:
  - View a **summary in chat format**  
    _e.g., “Summarize the key highlights of the meeting in a chat format”_
  - View a **more formal or structured version**  
    _e.g., “Summarize the meeting in a well-formatted report”_
  - Request an **alternative version** of an already viewed summary  
    _e.g., “Can I see that summary in a more formal style?”_

---

### 8. **extractMeetingActionItems**
- **Purpose**:  
    Extract structured **action items** and **next steps** from a specific meeting.

- **When to Use**:  
    Use this tool when the user asks for:
    - Action items from a meeting  
    _e.g., “What are the action items from the product review?”_
    _e.g., “Based on the meeting "strategy meeting", identify actionable tasks and next steps”_

---

## Custom responses

When the user asks for a specific meeting by title and/or date (e.g., "Can you show me the EXT: Zunou Stand-up meeting on May 8?"), respond with a concise, structured preview of the meeting details followed by a friendly prompt to guide the next action.

Use this format:

"""
Here’s the meeting you asked about:

📌 **Title:** {meeting_title}  
📅 **Date:** {meeting_date}

What would you like to see from this meeting?
You can choose from the following:
- 📝 **Summary** – A quick recap of key points discussed
- 📋 **Action Items** – Tasks or decisions made during the meeting
- 🧾 **Full Transcript** – Complete record of what was said
- 🔍 **Custom** – Ask about a specific topic or section

Let me know which you'd prefer, or feel free to ask something specific!
"""

---

## General Notes
- Respond only when the tool’s output aligns with the user’s request.
- For vague or conflicting instructions, clarify before acting — *but only when necessary*.
- Always return structured JSON using the expected schemas.
- Be concise, helpful, and focused — your job is to serve the user with clarity and precision.
EOD;
        return $prompt;
    }

    public function getFunctionCalls(): array
    {
        $tools = [
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'generateMeetingSummary',
                    'description' => 'This tool is responsible for generating summary for any kind of meeting. Strictly check if the matched data source queried has "Data Source Origin" of "meeting". Always use this tool when user ask for summary for the specific meeting. This tool accept and works only on single meeting summary generation.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            // accep torigin to force
                            'data_source_id' => [
                                'type'        => 'string',
                                'description' => 'This is the UUID, the unique identifier of the retrieved meeting from the knowledge base. Extract this from the lookupInformation tool under the "data_source_id" or "Data Source Id" field. Do not generate or assume this value.',
                            ],
                            'meeting_name' => [
                                'type'        => 'string',
                                'description' => 'The name of the meeting.',
                            ],
                            'user_lookup_prompt' => [
                                'type'        => 'string',
                                'description' => 'the prompt passed in lookupinformation tool',
                            ],
                        ],
                        'required' => [
                            'data_source_id',
                            'meeting_name',
                            'user_lookup_prompt',
                        ],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'extractMeetingActionItems',
                    'description' => 'Use this tool to extract structured action items, follow-ups, next steps, or decisions discussed in a specific meeting. This includes tasks assigned, deadlines mentioned, and outcomes agreed upon during the meeting. Always use this when the user requests actionable insights or tasks from a meeting. Only works with a single meeting, and only if the data source has "Data Source Origin" set to "meeting".',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'data_source_id' => [
                                'type'        => 'string',
                                'description' => 'The unique identifier (UUID) of the meeting data source retrieved via a meeting lookup tool. Must be taken directly from the "data_source_id" field of the lookup response. Do not generate or infer this value.',
                            ],
                            'meeting_name' => [
                                'type'        => 'string',
                                'description' => 'The name or title of the meeting, used to give context in responses and formatting.',
                            ],
                        ],
                        'required' => ['data_source_id', 'meeting_name'],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'notifyNewlyCreatedMeetingSummary',
                    'description' => 'Use this tool to notify pulse members or users about the summary meeting.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'summary_id' => [
                                'description' => 'The ID (uuid) of the newly generated summary of meeting.',
                                'type'        => 'string',
                            ],
                        ],
                        'required' => ['summary_id'],
                    ],
                ],
            ],

            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'editMeetingSummary',
                    'description' => 'This tool is called when user request updates on existing summary. This tool is exclusively for editing an existing summary. Do NOT call this immediately after generating a summary. Only use this tool when a user explicitly requests an update to a previously generated summary, and ensure that the summary ID exists before calling.',
                    'parameters'  => [
                        'type'       => 'object',
                        'required'   => ['summary_id', 'operations'],
                        'properties' => [
                            'summary_id' => [
                                'description' => 'The unique identifier of the summary to update.',
                                'type'        => 'string',
                            ],
                            'operations' => [
                                'description' => 'A list of operations to perform on the summary. Each item is object with key being the field and the value is the updated value of the field. Only pass the items thats needed to be updated.',
                                'type'        => 'array',
                                'items'       => [
                                    'type'       => 'object',
                                    'required'   => ['field', 'action'],
                                    'properties' => [
                                        'field' => [
                                            'description' => 'The field of the summary to update.',
                                            'type'        => 'string',
                                            'enum'        => [
                                                'summary',
                                                'name',
                                                'date',
                                                'attendees',
                                                'potential_strategies',
                                            ],
                                        ],
                                        'updated_value' => [
                                            'description' => 'The updated value of the field. Always keep the formatting of the original',
                                            'type'        => 'string',
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'viewAndCreatePersonalizedVersionOfMeetingSummary',
                    'description' => "A tool for generating a personalized version of the original summary notified by the management. After generate user can now view their summary. As of now the available formats are either 'Chat Summary' or 'Formatted Summary'",
                    'parameters'  => [
                        'properties' => [
                            'summary_id' => [
                                'description' => 'The id [UUID] of the original summary. Get this from the user provided context define in the system prompt labeled as summary_id.',
                                'type'        => 'string',
                            ],
                            'summary_type' => [
                                'description' => "The summary type, either 'Chat Summary' or 'Formatted Summary'",
                                'enum'        => ['Chat Summary', 'Formatted Summary'],
                                'type'        => 'string',
                            ],
                        ],
                        'required' => ['summary_id', 'summary_type'],
                        'type'     => 'object',
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'getUpcommingMeetings',
                    'description' => 'Get the upcoming meetings for the user. This is the meetings that are scheduled to happen in the next N days. Use this exclusively when the user asks for upcoming meetings, today, tomorrow, next week, etc.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'days' => [
                                'type'        => 'integer',
                                'description' => 'The number of days to get the upcoming meetings for',
                            ],
                        ],
                        'required' => ['days'],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'findMeetings',
                    'description' => 'Use this tool to find a meeting by title or date, passing a natural language query. This is especially useful when other tools (like generateMeetingSummary) require a specific meeting but the user has not provided enough detail.. Example prompts: “show my latest meetings”, “find meetings with marketing”.',
                    'parameters'  => [
                        'type'     => 'object',
                        'required' => [
                            'user_query',
                            'meeting_title',
                            'query_search_type',
                        ],
                        'properties' => [
                            'user_query' => [
                                'type'        => 'string',
                                'description' => 'The user-provided prompt about what meetings they want to retrieve.',
                            ],
                            'meeting_title' => [
                                'type'        => 'string',
                                'description' => 'The meeting title if provided in the query. Include only the actual title, exclude dates and generic word at the start and end of it.',
                            ],
                            'query_search_type' => [
                                'type' => 'string',
                                'enum' => [
                                    'date_only',
                                    'title_or_content_only',
                                    'both',
                                ],
                                'description' => 'REQUIRED. Indicates whether to filter by date only, title/content only, or both date and title/content. Set by user query intent.',
                            ],
                            'from_date' => [
                                'type'        => 'string',
                                'format'      => 'date',
                                'description' => 'ISO format date (YYYY-MM-DD) for the start range.',
                            ],
                            'to_date' => [
                                'type'        => 'string',
                                'format'      => 'date',
                                'description' => 'ISO format date (YYYY-MM-DD) for the end range.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'getLatestMeeting',
                    'description' => 'Use this tool to retrieve the most recently added meeting in the system. It is specifically designed to return the latest meeting record, regardless of prior history or query context. Use it when the user requests "latest", "most recent", or similar phrases.',
                    'parameters'  => [
                        'type'       => 'object',
                        'required'   => [],
                        'properties' => (object) [],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'getMeetingSummary',
                    'description' => 'Retrive the summary of a meeting',
                    'parameters'  => [
                        'properties' => [
                            'data_source_id' => [
                                'description' => 'The data_source_id (formatted in UUID) of the meeting data source.',
                                'type'        => 'string',
                            ],
                        ],
                        'required' => ['data_source_id'],
                        'type'     => 'object',
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'answerMeetingQuestion',
                    'description' => 'Answer the user\'s question based on meeting data source',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'query' => [
                                'type'        => 'string',
                                'description' => 'The query of the user to answer',
                            ],
                            'data_source_id' => [
                                'type'        => 'string',
                                'description' => 'The data source id found in knowledge base',
                            ],
                        ],
                        'required' => ['query', 'data_source_id'],
                    ],
                ],
            ],
        ];

        if ($this->allowedTools) {
            $tools = array_values(
                array_filter($tools, function ($item) {
                    $fnName = $item['function']['name'];
                    return in_array($fnName, $this->allowedTools);
                }),
            );
        }

        return $this->mergeFunctionCalls($tools);
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        try {
            $arguments = $this->cleanUuidFields($arguments);
        } catch (Exception $e) {
            Log::error($e->getMessage());
            return 'Some parameters are invalid. Please check and try again.';
        }

        switch ($functionName) {
            case 'generateMeetingSummary':
                return $this->generateMeetingSummaryHandler(
                    $arguments,
                    $orgId,
                    $pulseId,
                );

            case 'extractMeetingActionItems':
                $taskAgent = new TaskAgent($this->pulse);
                $response  = $taskAgent->handleFunctionCall(
                    'createTasks',
                    ['data_source_id' => $arguments['data_source_id']],
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );

                return $response;

            case 'getFirefliesMeetingList':
                return $this->getFirefliesMeetingListHandler(
                    $arguments,
                    $pulseId,
                );

            case 'getUpcommingMeetings':
                $days = $arguments['days'] ?? 1;
                $query = Event::query()
                    ->with('attendees')
                    ->where('organization_id', $orgId)
                    ->where('pulse_id', $pulseId)
                    ->where('user_id', $this->user->id)
                    ->orderBy(DB::raw("start_at || ' ' || COALESCE(start_at::text, '00:00:00')"), 'asc');
                
                // Get user's today start and end in their timezone, then convert to UTC for database comparison
                $userTodayStart = Carbon::today($this->user->timezone)->utc();
                $userTodayEnd = Carbon::today($this->user->timezone)->endOfDay()->utc();

                if ($days <= 1) {
                    $query->whereBetween('date', [$userTodayStart, $userTodayEnd]);
                } else {
                    $query->whereBetween('date', [
                        $userTodayStart,
                        Carbon::today($this->user->timezone)->addDays($days)->endOfDay()->utc(),
                    ]);
                }

                $results = $query->get();
                $results = $results->map(function ($item) {
                    $item->date = Carbon::parse($item->date)->tz($this->user->timezone)->format(
                        'F j, Y \a\t g:i A',
                    );
                    $item->start_at = Carbon::parse($item->start_at)->tz($this->user->timezone)->format(
                        'F j, Y \a\t g:i A',
                    );
                    $item->end_at = Carbon::parse($item->end_at)->tz($this->user->timezone)->format(
                        'F j, Y \a\t g:i A',
                    );
                    return $item;
                });
                return $results->toJson(JSON_PRETTY_PRINT);

            case 'notifyNewlyCreatedMeetingSummary':
                Log::info(
                    '[MeetingAgent] Received notifyNewlyCreatedMeetingSummary call',
                    $arguments,
                );

                $summary = Summary::find($arguments['summary_id']);
                if (! $summary) {
                    return 'The notification failed.';
                }

                $name = $summary->name ?? 'Meeting Summary';

                return $this->meetingHelper->sendSummaryNotesNotificationOnEmplyees(
                    description: "New $name added.",
                    type: NotificationType::PULSE->value,
                    pulseId: $pulseId,
                    summary_id: $arguments['summary_id'],
                );

            case 'editMeetingSummary':
                return $this->editMeetingSummaryHandler($arguments);
            case 'viewAndCreatePersonalizedVersionOfMeetingSummary':
                Log::info(
                    'Tool call: viewAndCreatePersonalizedVersionOfMeetingSummary',
                    $arguments,
                );
                try {
                    $response = $this->meetingHelper->generateTextSummary(
                        $arguments,
                        $pulseId,
                        $this->user->id,
                    );

                    $this->setCurrentToolResponseFormat(
                        'viewAndCreatePersonalizedVersionOfMeetingSummary',
                        MeetingSchema::GENERATED_SUMMARY,
                    );

                    return $response;
                } catch (\Exception $e) {
                    Log::error(
                        'Failed to generate Chat Summary: ' . $e->getMessage(),
                    );

                    return 'Error generating summary';
                }

            case 'getLatestMeeting':
                Log::info('Tool call: findMeetings', $arguments);

                $results = Meeting::where('pulse_id', $pulseId)
                    ->whereNotNull('data_source_id')
                    ->where('user_id', $this->user->id)
                    ->orderBy('date', 'desc')
                    ->select(['title', 'date', 'data_source_id'])
                    ->limit(5)
                    ->get();
                return $this->parseResults($results);

            case 'findMeetings':
                Log::info('Tool call: findMeetings', $arguments);

                $searchType = $arguments['query_search_type'] ?? null;
                Log::info('Search type:', ['query_search_type' => $searchType]);

                $query = Meeting::where('pulse_id', $pulseId)
                    ->whereNotNull('data_source_id')
                    ->where('user_id', $this->user->id);

                if (! empty($arguments['from_date'])) {
                    $fromDateTime = Carbon::parse(
                        $arguments['from_date'],
                    )->startOfDay();
                    $query->where('date', '>=', $fromDateTime);
                    Log::info('From date filter applied', [
                        'from_date' => $fromDateTime->toDateTimeString(),
                    ]);
                }

                if (! empty($arguments['to_date'])) {
                    $toDateTime = Carbon::parse(
                        $arguments['to_date'],
                    )->endOfDay();
                    $query->where('date', '<=', $toDateTime);
                    Log::info('To date filter applied', [
                        'to_date' => $toDateTime->toDateTimeString(),
                    ]);
                }

                $query
                    ->orderBy('date', 'desc')
                    ->select([
                        'title',
                        'date',
                        'data_source_id',
                        'source',
                        'organizer',
                    ]);

                if ($searchType && $searchType === 'date_only') {
                    $results       = $query->get();
                    $parsedResults = $this->parseResults($results);
                    return json_encode([
                        'type'    => 'meeting_list',
                        'message' => 'Here are the meetings I found based on your request.',
                        'data'    => [
                            'meetings' => $parsedResults,
                        ],
                    ]);
                }

                if (! empty($arguments['meeting_title'])) {
                    $originalTitle = $arguments['meeting_title'];
                    $strippedTitle = preg_replace(
                        '/\s*\bmeetings?\b\s*$/i',
                        '',
                        $originalTitle,
                    );

                    Log::info('Meeting title search applied', [
                        'original_title' => $originalTitle,
                        'stripped_title' => $strippedTitle,
                    ]);

                    $query->where(function ($q) use (
                        $originalTitle,
                        $strippedTitle
                    ) {
                        $q->orWhereRaw(
                            "to_tsvector('english', title) @@ plainto_tsquery('english', ?)",
                            [$originalTitle],
                        )->orWhereRaw(
                            "to_tsvector('english', title) @@ plainto_tsquery('english', ?)",
                            [$strippedTitle],
                        );
                    });

                    $results       = $query->get();
                    $parsedResults = $this->parseResults($results);

                    if (count($parsedResults) > 0) {
                        return "Here are the results based on the query. Double-check if they align with the user's intent. If unsure, ask the user and present options in this format.\n\n" .
                            json_encode([
                                'type'    => 'meeting_list',
                                'message' => 'Here are the meetings I found based on your request.',
                                'data'    => [
                                    'meetings' => $parsedResults,
                                ],
                            ]);
                    }
                }

                Log::info('Falling back to similarity search');
                $matches = $this->meetingHelper->queryMeetingsWithSimilaritySearch(
                    $arguments,
                    $orgId,
                    $pulseId,
                );

                if (empty($matches)) {
                    Log::info('Similarity search returned no matches');
                    return 'No meetings matched your query. Depending on the query ask if there are typo in the name of the meeting or different date.';
                }

                Log::info('Similarity search results', ['matches' => $matches]);

                $matches = json_encode($matches, JSON_PRETTY_PRINT);

                return <<<TEXT
{$matches}
TEXT;

            case 'getMeetingSummary':
                Log::info('Tool call: getMeetingSummary', $arguments);

                return $this->getMeetingSummaryHandler($arguments);

            case 'answerMeetingQuestion':
                Log::info(
                    '[MeetingAgent] Received answerMeetingQuestion call',
                    $arguments,
                );

                $helper   = new DataSourceHelper($orgId, $pulseId);
                $response = $helper->query(
                    $arguments['query'],
                    $arguments['data_source_id'],
                );

                return $response;

            default:
                return parent::handleFunctionCall(
                    $functionName,
                    $arguments,
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );
        }
    }

    protected function parseResults($results)
    {
        return $results->map(function ($meeting) {
            return [
                'title' => $meeting->title,
                'date'  => Carbon::parse($meeting->date)->tz($this->user->timezone)->format(
                    'F j, Y \a\t g:i A',
                ),
                'data_source_id' => $meeting->data_source_id,
                'source'         => $meeting->source,
                'organizer'      => $meeting->organizer,
            ];
        });
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        // assume the last incoming message is what you want to send
        $last = $messages->last();
        $text = $last['content'] ?? '';

        return $this->processSystemThread(
            'meetingAgent',
            $text,
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }

    protected function parseMeetingForAI($meetings)
    {
    }

    private function generateMeetingSummaryHandler(
        array $arguments,
        string $orgId,
        string $pulseId,
    ): string {
        try {
            $startTime = microtime(true);
            $arguments = ToolParserHelper::sanitize($arguments);

            $validator = Validator::make($arguments, [
                'meeting_name'       => 'required',
                'data_source_id'     => 'required',
                'user_lookup_prompt' => 'required',
            ]);

            if ($validator->fails()) {
                Log::debug(
                    '[AdminBase Agent] Invalid arguments passed in generateMeetingSummary tool',
                    $validator->errors()->toArray(),
                );
                return "Invalid arguments received in tool. can't process the request";
            }

            // track the transcript base on meeting transcript
            // if meeting is not yet added, tell the its not yet added

            $dataSourceRecord = DataSource::withTrashed()
                ->where('id', $arguments['data_source_id'])
                ->first();
            if (! $dataSourceRecord) {
                return 'No data source was found with that ID. Did you call the findMeetings tool first? If not, please call it to retrieve the meeting data source.';
            }

            if (
                $dataSourceRecord->status === DataSourceStatus::Deleted->value
            ) {
                return 'This meeting record has been deleted and is no longer available for actions. Respond to user with frienly warm message indicating that the message is deleted';
            }

            // check if have meeting but no data source
            $summary = Summary::where(
                'data_source_id',
                $arguments['data_source_id'],
            )
                ->orderBy('created_at', 'asc')
                ->first();

            if ($this->recommendation && $summary) {
                // return already exists and update recommendation to view
                Log::info("MeetingAgent: Recommendation found, change response schema to view", [
                    'recommendation' => $this->recommendation->title,
                ]);
            }

            if ($summary) {
                $this->setCurrentToolResponseFormat(
                    'generateMeetingSummary',
                    MeetingSchema::GENERATED_SUMMARY,
                );

                $responseJson = json_encode(
                    [
                        'summary' => 'The [Meeting Name] Summary is now available! Highlight key: [The highlight of the meeting in one line]',
                        'content' => [
                            [
                                'summary_id' => $summary->id,
                                'text'       => $summary->name,
                            ],
                        ],
                    ],
                    JSON_PRETTY_PRINT,
                );

                $summary->toJson();
                return <<<EOD
Here's the generated summary:
$summary


But only send this json on the user as the response.
Change the summary field[headline] saying summary is already created, Also Add the Date in the headline Month, Day"
$responseJson

Strictly return that json only. The created summary will be context if user asks for follow up modification to the summary
EOD;
            }

            $transcript = Transcript::where(
                'data_source_id',
                $arguments['data_source_id'],
            )->first();

            $dataSourceContent = null;
            $dataSourceId      = $arguments['data_source_id'];

            // handle valid data source id passed
            if ($transcript) {
                $dataSourceContent = $transcript->content;
                $dataSourceId      = $transcript->data_source_id;
            }

            $dataSourceHandler = new DataSourceHandler($orgId, $pulseId);
            if (! $dataSourceContent) {
                // check if meeting is passed  instead
                $meeting = Meeting::find($arguments['data_source_id']);
                if ($meeting) {
                    $dataSource = $meeting->dataSource;
                    if (! $dataSource) {
                        return 'Meeting is not yet added by the user. Needed to be added first before trying again. Inform the user with a friendly message';
                    }

                    $transcript = $dataSource->transcript;
                    if ($transcript) {
                        $dataSourceContent = $transcript->content;
                        $dataSourceId      = $transcript->data_source_id;
                    }
                }
            }

            if (! $dataSourceContent) {
                $dataSourceContent = $dataSourceHandler->retrieveFullText(
                    $arguments['data_source_id'],
                );
            }

            if (! $dataSourceContent) {
                return 'It looks like you pass different kind of id. Make sure to use lookup tool to get the full information of the meeting.';
            }

            $summaryStartTime = microtime(true);
            $summaryObj = $this->meetingHelper->generateSummary(
                $dataSourceContent,
                $this->user->id,
            );
            $summaryTimeDiff = microtime(true) - $summaryStartTime;
            Log::debug('MeetingAgent: generateSummary time: ' . $summaryTimeDiff . ' seconds');

            $taskAgent = new TaskAgent($this->pulse);
            if (! empty($summaryObj['action_items'])) {
                $action_items = $taskAgent->processMeetingTasks(
                    $summaryObj['action_items'] ?? [],
                    $orgId,
                    $pulseId,
                );
            } else {
                $action_items = [];
            }

            $payload = [
                'name'                 => $summaryObj['metadata']['meeting_name'] . ' Summary',
                'pulse_id'             => $pulseId,
                'user_id'              => $this->user->id,
                'data_source_id'       => $dataSourceId,
                'date'                 => $summaryObj['metadata']['meeting_date'],
                'attendees'            => $summaryObj['metadata']['attendees'],
                'action_items'         => json_encode($action_items),
                'potential_strategies' => json_encode(
                    $summaryObj['potential_strategy'] ?? [],
                ),
                'summary' => MarkdownParser::clean($summaryObj['summary']),
            ];

            if ($this->recommendation) {
                // use the pattern : for none crud operation to resource
                $payload['headline'] = $summaryObj['metadata']['headline'];
                $this->saveRecommendationAction('meeting', 'create:summary', $payload);
                return "Success! " . $payload['name'] . " created";
            }

            $createdSummary = Summary::create($payload);

            $this->setCurrentToolResponseFormat(
                'generateMeetingSummary',
                MeetingSchema::GENERATED_SUMMARY,
            );

            $responseJson = json_encode([
                'summary' => $summaryObj['metadata']['headline'],
                'content' => [
                    [
                        'summary_id' => $createdSummary->id,
                        'text'       => $createdSummary->name,
                    ],
                ],
            ]);

            $timeDiff = microtime(true) - $startTime;
            Log::debug('MeetingAgent: generateMeetingSummaryHandler time: ' . $timeDiff . ' seconds');

            $createdSummary->toJson();

            return <<<EOD
Here's the generated summary:
$createdSummary

But only send this json on the user as the response.
$responseJson

Strictly return that json only. The created summary will be context if user asks for follow up modification to the summary
EOD;
        } catch (Exception $e) {
            Log::error('[AdminBase Agent] ' . $e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something wen't wrong. can't process the request";
        }
    }

    private function getFirefliesMeetingListHandler(
        array $arguments,
        string $pulseId,
    ): string {
        $arguments = ToolParserHelper::sanitize($arguments);

        $fromDate = ! empty($arguments['query']['fromDate'])
            ? $arguments['query']['fromDate']
            : '';
        $toDate = ! empty($arguments['query']['toDate'])
            ? $arguments['query']['toDate']
            : '';
        $limit = ! empty($arguments['query']['limit'])
            ? $arguments['query']['limit']
            : 15;
        $skip = ! empty($arguments['query']['skip'])
            ? $arguments['query']['skip']
            : 0;
        $keywords = ! empty($arguments['query']['keywords'])
            ? $arguments['query']['keywords']
            : '';

        Log::debug('querying meetings table with the ff args', [
            'userId'   => $this->user->id,
            'fromDate' => $fromDate,
            'toDate'   => $toDate,
            'limit'    => $limit,
            'skip'     => $skip,
            'keywords' => $keywords,
        ]);

        try {
            $meetings = $this->meetingHelper->getMeetingList(
                userId: $this->user->id,
                pulseId: $pulseId,
                fromDate: $fromDate,
                toDate: $toDate,
                limit: $limit,
                skip: $skip,
                keywords: $keywords,
            );

            if ($meetings->isEmpty()) {
                return 'no meetings found';
            }

            $this->setCurrentToolResponseFormat(
                'getFirefliesMeetingList',
                MeetingSchema::MEETINGS_LIST,
            );

            return json_encode([
                'type'    => 'meeting_list',
                'message' => $arguments['acknowledgment'],
                'data'    => [
                    'meetings' => $meetings,
                ],
            ]);
        } catch (Exception $e) {
            Log::error($e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something wen't wrong. can't process the request";
        }
    }

    private function editMeetingSummaryHandler(array $arguments): string
    {
        try {
            $validator = Validator::make($arguments, [
                'summary_id'         => 'required|string',
                'operations'         => 'required|array',
                'operations.*.field' => [
                    'required',
                    'string',
                    Rule::in([
                        'summary',
                        'name',
                        'date',
                        'attendees',
                        'potential_strategies',
                    ]),
                ],
                'operations.*.updated_value' => 'required|string',
            ]);

            if ($validator->fails()) {
                return 'Invalid parameters passed. Cant update the summary at the moment';
            }

            $summaryId = $arguments['summary_id'];
            $summary   = Summary::find($summaryId);

            if ($this->recommendation) {
                $this->saveRecommendationAction('meeting', 'update:summary', [
                    "summary_id" => $summary->id, 
                    "operations" => $arguments['operations']]
                );
                return "Success!, Meeting summary updated. You can now view the summary in your pulse.";
            }

            foreach ($arguments['operations'] as $operation) {
                if ($operation['field'] === 'summary') {
                    $operation['updated_value'] = MarkdownParser::clean(
                        $operation['updated_value'],
                    );
                }
                $summary[$operation['field']] = $operation['updated_value'];
            }

            $summary->save();

            $updatedSummary = $summary->toJson();

            $this->setCurrentToolResponseFormat(
                'editMeetingSummary',
                MeetingSchema::GENERATED_SUMMARY,
            );

            return <<<EOD
Success!, Meeting updated.

Here's the updated version,

$updatedSummary

Do not return the actual summary unless explicitly instructed by user.
EOD;
        } catch (Exception $e) {
            Log::error($e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something wen't wrong. can't process the request";
        }
    }

    private function handleQueryMeetingsWithLLM(
        array $arguments,
        string $orgId,
        string $pulseId,
    ): string {
        $userPrompt = $arguments['user_query'];
        $results    = $this->meetingHelper->queryMeetingsWithLLM(
            userId: $this->user->id,
            pulseId: $pulseId,
            userPrompt: $userPrompt,
        );
        if ($results->isEmpty()) {
            // perform secondary search, semantic
            $matches = $this->meetingHelper->queryMeetingsWithSimilaritySearch(
                $arguments,
                $orgId,
                $pulseId,
            );

            if (empty($matches)) {
                return 'No meetings matched your query.';
            }

            return json_encode([
                'type'    => 'meeting_list',
                'message' => 'Here are the meetings I found based on your request.',
                'data'    => [
                    'meetings' => $matches,
                ],
            ]) .
                "\n\nPick the most relevant meeting, this is ordered based on similarity to the user query";
        }

        $this->setCurrentToolResponseFormat(
            'queryMeetingsWithLLM',
            \App\Schemas\MeetingSchema::MEETINGS_LIST,
        );

        return json_encode([
            'type'    => 'meeting_list',
            'message' => 'Here are the meetings I found based on your request:',
            'data'    => [
                'meetings' => $results,
            ],
        ]);
    }

    public function getMeetingSummaryHandler(array $arguments): ?string
    {
        try {
            if (! isset($arguments['data_source_id'])) {
                return 'Valid data_source_id is required to use this tool, find the correct data source first.';
            }

            $dataSource = DataSource::find($arguments['data_source_id']);
            if (! $dataSource) {
                return 'No data source with this id ' .
                    $arguments['data_source_id'] .
                    '. Find the correct data source first.';
            }

            if (
                is_null($dataSource->origin) || $dataSource->origin->value !== 'meeting'
            ) {
                return 'This tool can only generate meeting data sources, hand over the task to other tools. If none generate yourself';
            }

            $summary = Summary::where(
                'data_source_id',
                $arguments['data_source_id'],
            )->first();
            if (! $summary) {
                return "This meeting do not have meeting yet.\n 
                Respond to user in this manner\n
                'Hi {name}, Looks like the summary for this meeting is not yet generated by manager. Ask the pulse manager to generate summary first.'\n
                You can also add 1 sentence overview about the meeting in your response";
            }

            $summaryJson = $summary->toJson();

            $response = <<<EOD
Here's the summary:
$summaryJson

However, return just this json format to the user.
```json
{
    "summary": "Short headline with short description for summary. strictly maintain this structure at all times "The [title of meeting] Summary is now available! Highlight key: [key high light of the meeting]",
    "content": [
        {
            "summary_id": "The id (uuid format) of the meeting summary",
            "text": "The title of the summary"
        }
    ]   
}
```

Make sure do not alter the formatting and values.
EOD;

            $this->setCurrentToolResponseFormat(
                'getMeetingSummary',
                MeetingSchema::GENERATED_SUMMARY,
            );
            return $response;
        } catch (\Exception $e) {
            Log::error('Failed to retrieve Summary: ' . $e->getMessage());

            return 'Cannot retrieve summary at the moment';
        }
    }
}
