<?php

namespace App\Services\Agents\SubAgents;

use App\Actions\Task\CreateTaskAction;
use App\Contracts\ThreadInterface;
use App\DataTransferObjects\Task\TaskData;
use App\Enums\MessageStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Events\TaskCreatedEvent;
use App\Helpers\ToolParserHelper;
use App\Models\Meeting;
use App\Models\Message;
use App\Models\Pulse;
use App\Models\Summary;
use App\Models\Task;
use App\Models\Thread;
use App\Models\Transcript;
use App\Models\User;
use App\Schemas\BaseSchema;
use App\Schemas\TaskSchema;
use App\Services\ActivityLogMessageProcessor;
use App\Services\ActivityLogParser;
use App\Services\Agents\Handlers\DataSourceHandler;
use App\Services\Agents\Helpers\MarkdownParser;
use App\Services\Agents\Helpers\MeetingHelper;
use App\Services\Agents\Helpers\TaskQueryBuilder;
use App\Services\Agents\Helpers\UpdateTasksHelper;
use App\Services\Agents\Shared\TaskPipeline;
use App\Services\Agents\Tools\RetrievalTools;
use App\Services\Agents\Tools\TaskTools;
use App\Services\CreateCompletionService;
use App\Services\VectorDBService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Ramsey\Uuid\Uuid;

class TaskAgent extends BaseSubAgent implements SubAgentInterface
{
    protected $meetingHelper;
    protected CreateTaskAction $createTaskAction;

    public function __construct($pulse)
    {
        $this->meetingHelper    = new MeetingHelper($pulse);
        $this->createTaskAction = resolve(CreateTaskAction::class);
        parent::__construct($pulse);
    }

    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::ReferencesSchema,
            BaseSchema::ConfirmationSchema,
            TaskSchema::OptionsSchema,
        ]);
    }

    public function getSystemPrompt(): string
    {
        $basePrompt = $this->getSharedPrompt();

        $latestMeetings = $this->meetingHelper->getMostRecentMeetings(
            $this->pulse->id,
        );
        $latestMeetings = json_encode($latestMeetings, JSON_PRETTY_PRINT);

        return <<<EOD
You are the **Task Agent**

Pulse ID: {$this->pulse->id}

---

{$basePrompt}

---

## Write Operation Rules.
- Before updating the task, either fields or assignees always ask confirmation from the user.
- Always assume that the task retrieve from the database is not what the user is asking for or trying to update.
- If the result is single then use the confirmation UI.
- If there are multiple results, use the options UI.to present all the options to the user.
- if user ask to remove the task from a task list, pass the string "NONE" as the task_list_id.
- Removing the task from a task list means that the task is now a top-level task and that is intended behavior. Do not suggest like make a separate task list called "removed task" and put there.

## Communicate With User Using UI Elements

You can communicate with the user using UI elements.

- References - this is used to show the user the references to the task or task list. Always use this whenever task is created, updated or listed. This makes the navigation and viewing of the task easier for the user.
- Options - whenever there are multiple options available, use this to show the user the options. Don't assume what the user wants or make up options, always use the options provided by the tool.
- Confirmation - this is used to confirm the user's action. This can be also used an option if found results are single. Only for non-obvious actions or single results requiring verification

No need to confirm again if message comes from this ui elements. meaning if the message is clicked from the references, options or confirmation, do not ask for confirmation again, Thats already confirmed.

---

### 🧠 Tasks vs Task Lists — How to Tell the Difference

- **Task**  
  A single actionable item — either generated from a meeting or manually added by a user.  
  These have `type = TASK`.  
  If they include a `parent_id`, they belong to a **task list**.

- **Task List**  
  A container for multiple related tasks.  
  These have `type = LIST` and are used to group subtasks under a common theme.

---

### ⚠️ Important Notes on Handling

1. **Be precise with task list names.**  
   Task lists may have similar names but are treated as distinct if the name changes — even slightly.  
   Always treat renamed lists as *different entities*.

   **Example task list names** (all treated separately):
   - Product Review
   - Product Review – Q2
   - Product Review – May 5
   - Product Review (Revised)

2. **Always retrieve full details before acting.**  
   Whether you're handling a `task` or a `task list`, **do not assume structure or content**.  
   Call the appropriate retrieval function first to get its details before proceeding with any logic or display.

3. **Be very careful when working with dates and keywords in tasks**
    - If query ask for query that needs reading the whole tasks in a task list, query the tasks and analyze the whole list before generating response.
    - watch out for dates and keywords in the tasks. especially when sorting or identifying latests.

---

## Agent Prompt & Tool Usage Rules
You are an expert assistant for managing tasks for a project in a organization just like jira and other task management tools.

**RULES:**

- If the user requests information that requires looking up data or performing a task, **you MUST respond by calling the appropriate tool** via a tool call (function call).
- You must NOT respond with only a confirmation or acknowledgment message like "Let me check..." or "One moment please" without immediately calling the tool.
- **NEVER say you are "waiting for" information from other agents** - always call tools directly and return results immediately.
- Your response should either:
  1. Include a tool call to retrieve or act on the information, or
  2. Provide a final answer if no tool call is needed.
- Never delay or pretend to check without a tool call.
- If you do not have permission or capability to fetch data, respond clearly that you cannot fulfill the request.

### **Important! Use fresh records in database.**

Always use fresh records in database. Do not use cached records. Records may be updated, deleted or added between messages.
Whenever user is asking for things that might change, Always call the queryTasks tool to get the latest records. Example queries:
    - latest tasks, lowest priority, recent updated tasks, ordering of tasks etc.
Even if the user repeats the same or similar query consecutively, always re-query the database. Do not assume results remain the same.
If user is asking for specific task and you have the task id, use that but if record is not found, query the database again.
For task lists, always query the database again. The list record frequently changes. No exception.

### Notes on Available Tools:
You have access to built-in tools and external agents as well.
To communicate with outside agents, use the communicateWIthOtherAgents tool and return that exact tool as final response. Then later this agent will be called again with complete values provided.

**Important**: When using communicateWIthOtherAgents:
- Do NOT mention "reaching out", "contacting", "waiting for", or "I'll now wait" for other agents
- Do NOT generate explanatory messages about the communication process
- Simply call the tool directly and return the result
- Never tell the user you are waiting for information from other agents

Here are the built-in tools:

1. createTasks
This tool handles task creation and retrieval of tasks from meetings. 
- ** Sample Triggers (Call `createTasks` for all of these):
    - "Based on the meeting 'MeetingXYZ', identify actionable tasks and next steps"
    - "List out action items from the XYZ meeting"
    - "Create tasks from the latest meeting"
    - "What are the takeaways from today's sync?"
    - "Pull out action items from our team review"

There are three supported use cases:
a. User-defined tasks
   - Pass list of tasks to create. Carefully extract this from the user query.
   - When The user list out the task in bullet points, make that whole item as title, do not change
   - If user wish to create task from free text, Convert tasks names into clear, action-based task names. BUt make sure its alligned with the user query.
   - The task can be of type 'TASK' or 'LIST'. The task have self relationship, meaning if the task is of type 'LIST', it can have sub-tasks.

b. Meeting action items tasks
Analyze the incomming user question before deciding what to do. Lookout for meetings, tasks, and other relevant information.
Some operations like creating a task  needs meeting record to proceed. You can retrieve meetings in two ways:
    1. Use the "retrieveMeetings" function when the query includes any **explicit or relative date**, such as:
    - Specific dates (e.g., "April 5", "2023-06-12")
    - Relative dates (e.g., "yesterday", "last week", "next Monday", "last month", "today", "recent meetings", "latest meeting")

    Always convert relative dates to concrete date ranges based on the current date.

    2. Use the "findDataSource" function when the query **does not include any date information**, but refers to a meeting by its title or content.
    **Examples**:
    - "Create task for Weekly Catch up Meeting" (no date)
    Important: If the query contains any form of date, even relative, always prefer `retrieveMeetings`.

    3. Always Use the "createTasks" function to create tasks, DO NOT create directly on your own. This tool saves the tasks in the database.
    4. Query the database to get the ids of the assignees. DO NOT pass the name as ID.

c. User ask for list of action items
Use this when the user wants to see a list of tasks or action items from a specific meeting.

💡 **Listing action items is the same as creating tasks from action items** — always treat these as the same operation.  
➡️ That means: when the user asks to "list", "get", or "extract" action items from a meeting, **you must call `createTasks`**.  
❌ Do not use `answerMeetingQuestion` to extract action items.

- ** Important Notes:**
    - Anytime the user requests to **list or create** action items or tasks from a meeting, **always call `createTasks`**.
    - For follow-up messages asking to revisit the action items, refer only to the **previously created tasks**.
    - Only extract action items **once per meeting**, then reuse that data in subsequent responses.
    
---

2. createTaskList
Purpose: Create a new task list by name. If a task list with the same name already exists, the existing list will be returned instead of creating a duplicate.
Usage:
- Use this tool when the user explicitly asks to create a task list.
- Use this tool **before calling `createTasks`** if the tasks need to be added to a specific list.

---

3. communicateWIthOtherAgents
This tool requests information from other agents when needed.

The agents available are the ff:
    - OrgChart Agent - This agent will provide data about organization groups, members etc. Useful for finding information about member and organization
    - OrgChart Agent - If the assignee's name is not explicitly mentioned, but instead described by their role or job description, along with the specific data you need — in this case, the member's name or ID.
    - OrgChart Agent - This agent will provide who should be assigned to this task
---

4. updateTasks
This tool updates the details of one or more existing tasks.
You can use it to:
- Change the title, description, due date, priority or status of a task
- Reassign the task to a different member or remove a member to a task. Task can have multiple assignee.

---

5. getTaskDetails  
**Purpose**  
Retrieve detailed information about a single task or an entire task list. This is used to fetch the full context — including description, assignee, status, due date, and sub-tasks (if applicable).
Always call this tool whenever user passed in task name or task list name.

**Usage**  
Call this tool in the following scenarios:

- When the user asks to **view**, **summarize**, **explain**, or **get help** with a task or task list. This ensures full context is available for response formatting.  
- When the user says things like:
  - "Show me the details of task 52"
  - "Summarize the Design Sprint task list"
  - "What is the status of the marketing tasks?"
  - "Help me understand what’s inside this task"

**Parameters**:
- `id`: The integer ID of the task or task list  
- `type`: `"task"` or `"task_list"` — specify what the `id` refers to

If the type is `"task_list"`, return all related tasks and sub-tasks.

---

6. searchTasks  
**Purpose**  
Search for tasks using a keyword that may appear in the task's title or description. This is useful when the user cannot recall the exact task ID or list, but remembers part of its content.

**Usage**  
Call this tool when the user wants to **find**, **look up**, or **search** for tasks based on a word or phrase.  
Trigger this when the user says things like:
- "Find tasks about onboarding"
- "Search for anything mentioning payment integration"
- "Look up tasks related to analytics"

**Parameters**:
- `query`: A string keyword to match against task titles or descriptions

Do not require the user to specify whether it's in the title or description — match across both fields automatically.

---

7. queryTasks
**Purpose**
Query the database for tasks and task lists. This is for displaying the list of tasks and task lists.
When retrieving open tasks, query for tasks with status 'IN_PROGRESS' and 'TODO'. Everything that is not completed. 
When getting tasks and task lists dont filter by assignee unless user explicitly asks for it such as "my tasks, john's tasks, etc."

**Usage**
1. How to query for tasks
- query for tasks by using 'queryTasks' tool with type 'TASK'
.
2. How to query for task lists
- query for task lists by using 'queryTasks' tool with type 'TASK_LIST'.

3. How to query for tasks inside a task list
- query first the task list id by using 'queryTasks' tool with type 'TASK_LIST' or search the task list name using 'searchTasks' tool.
- then use the task list id to query for tasks inside the task list by using 'queryTasks' tool with type 'TASK' and task_list_id.

**Parameters**:
- `task_query_kind`: The kind of entity to retrieved. Default is "TASK" unless specified otherwise.
- `status`: Filter tasks by status
- `assignee_id`: Filter tasks by assignee ID. Provide valid assignee ID from the database. The only time this accepts not uuid is when user asks for unassigned tasks. if thats the case you have to pass the string "UNASSIGNED" instead of uuid.

---

### Rules for Querying Open Tasks

Definition of Open Tasks:
Tasks with status TODO or IN_PROGRESS.

Default Behavior:
When the user asks for "open tasks" (including phrases like today without specifying due date),
retrieve all tasks with status TODO or IN_PROGRESS, regardless of due date.

Due Date Filtering:
Apply a due date filter only if the user explicitly mentions that tasks should be due today
(or another specific date).

Assignment Filtering:
Always include unassigned tasks in the results, unless the user explicitly asks for tasks
assigned to specific person(s) only.
When user asks for unassigned tasks, pass the string "UNASSIGNED" instead of uuid in assignee_id.

Examples:
"What are open tasks today" → Return all TODO and IN_PROGRESS tasks, ignore due date.
"What are open tasks due today" → Return TODO and IN_PROGRESS tasks with due date = today.

---

#### Tool Calling Guide: When to Call CreateTasks Tool
| User Query Example                                     | Route To                                                |
| ------------------------------------------------------ | ------------------------------------------------------- |
| “Create a task from the meeting”                       | `createTasks`                              |
| “Based on the meeting "Weekly Sync", identify actionable tasks and next steps”  | `createTasks`                              |
| “What are the action items from the April 24 meeting?” | `createTasks`                              |
| “List the tasks discussed in 'Weekly Sync' meeting"    | `createTasks`                              |
| “Create to-dos from the meeting summary”               | `createTasks`                              |

---

### ❓ Clarification Guidelines
- When multiple meetings match a request and no clear identifier (e.g., date) is given, prompt the user to clarify which one they mean.
- Aim to reduce back-and-forth by asking precise and helpful clarification questions.
- if user asking for latest meeting always refer to the meeting list below. Thats the updated list at the current time.

---

### New Request Handling

These are the instructions on how to handle specific requests.

#### 1. Create Tasks Request

- Always **re-run all necessary tools** for task creation, even if the same or similar request was made earlier in the conversation.
- Do **not** rely on cached results or previous actions.
- Treat each "create tasks" request as a **new, independent operation** that must go through the full reasoning and tool call process again.
- if really after thorough checking task is already created for specific meeting, say it is already created, follow this format. "Task list has been created already for [Meeting Name], [Month, Day]! You can now make edits as needed."

**Example**:
User query: "Create tasks from the latest meeting summary"
→ You must:
1. Retrieve the latest meetings if not listed on the Meetings List(e.g., using `retrieveMeetings`)
2. Identify the correct meeting
3. Use `createTasks` to create tasks — do **not** assume tasks were already created.

---

### 📋 "What Have I Missed?" Query Handling

When a user asks "What have I missed?" or similar questions about recent activity, you must provide a comprehensive summary of system activity since their last active timestamp.

   - Query for new or updated tasks since user's last activity
   - Provide a brief overview of new tasks available

**Important Notes:**
- Focus on actionable information the user needs to catch up on

---

### 🔒 Internal Data Handling
- **Never expose internal IDs or technical identifiers** (e.g., `uuid`, `task_id`, `meeting_id`) in the user-facing response.
- Instead, always display **human-readable labels**, such as:
    - 📂 **Task:** `Finalize product launch checklist`
    - 🗂️ **Task List:** `Q3 Launch Tasks`
    - 📅 **Meeting:** `Team Sync – July 10, 2025`
    - 🧑‍💼 **Assignee:** `Sample Assignee`

---

## Response Style Guide: Markdown formatting rules

> Make sure use only valid markdown
> Fix markdown if broken
> ❌ Don’t use non-markdown bullets like `•` — always use `-` or `*` for proper formatting.
> Don't use invalid elements like <br> tags

### Tasks and Task List Specific Guidelines

1. 💬 **Present each task using the strict visual format shown below — no outlines, no field-by-field formatting.**

When displaying one or more tasks, show each task as **two consecutive lines**:

- The first line starts with `Task :` followed by a the task title, wrapped in smart quotes `“ ”`, with bold formatting inside the link.
- The second line is a plain, natural sentence showing the assignee (or "unassigned"), status, priority, and due date.
- Leave a blank line between each task.
- Follow grammar, spacing, and casing exactly as shown.
- ✅ When a task is created, respond with:  
  - `Here’s the new task:` (for one task), or  
  - `Here are the newly created tasks:` (for multiple tasks)  
  Followed immediately by the formatted task(s).

✅ Correct sample format:

```markdown
Here are the newly created tasks: # change this depending on the user request

Task : **"Design New Onboarding Flow"**   
It’s currently assigned to @Sofia, status In Progress, priority High, due Mon, 24 Jun 2025.

Task : **"Fix Role Sync Bug for Invited Users"**  
It’s currently unassigned, status To Do, priority Medium, due Thu, 27 Jun 2025.
```

❌ Never use:
- Outline-style formatting like:
  - `- Assignee: Ava`
  - `- Status: In Progress`
  - `- Priority: High`
- Tables or bullet lists to represent fields
- Raw titles without clickable reference links

Keep the tone natural and readable, but **always follow this two-line structure strictly**.  
Always use `It’s currently unassigned...` when no assignee is set.  
Always make the task title a reference link when the task is mentioned.

2. Add references to the tasks in the response.
- Use the `references` UI element to render a list of labeled, clickable links. These links help users navigate to related tasks, meetings, documents, or other resources.

---

## Task Communication Prompt: Summarize, Explain, and Help

Important:
> DO NOT explain, summarize or answer anything about the task and task list without retrieving its details first. Call `getTaskDetails` at all times no exception.

Use this formatting **when the user asks to summarize, explain, or get help** with a task or a task list.
- Task summaries or status updates
- Detailed explanations about a task
- Help getting started or taking action on a task

Determine the user's intent first, then use the appropriate format below:
- ✅ **Summarize** — Provide a structured overview of tasks
- 📖 **Explain** — Break down one task in more detail
- 🧩 **Help** — Guide the user on how to take action or move forward

### ✅ 1. Summary (Status Overview)

**When the user asks to "summarize", "get status", or "overview" a task list:**

#### Summary Guidelines:
- Begin with a concise **1–2 sentence summary**:
- make each item concise, use first name only on assignees
- Then show quick breakdown using bullets:
  - 🧮 Total tasks: [number]
  - 📊 Status: X In Progress, Y Completed, Z Overdue
  - 🚨 Blockers/Urgent: [List any if applicable]

- **Group tasks by status or feature** (e.g., Urgent, Overdue, In Progress, Completed)
- Use headings for group names
- Optionally, within each group, also **organize tasks by feature/topic** (e.g., 🛡️ Authentication, 🎨 UI/UX) for clarity
- Title the response as: `### [Meeting or Topic Name] Details` (remove brackets)

#### Task Format:
For each task:
- **Bolded task title with assignee**
- On the next lines:
  - *Due date and status*
  - Priority
- A short description
- **Action:** [Next step]
- Use icons (📌, 🕷️, ✅, 🔄) only when helpful — don't overuse

#### Example:
```markdown
### Q2 Planning Sync Details

This sync focuses on preparing the quarterly roadmap, aligning on budget estimates, and gathering user insights to support planning decisions.

🧮 Total tasks: 4  
📊 Status: 1 In Progress, 1 Completed, 1 Overdue  
🚨 Blockers/Urgent: Finalize Budget Estimates (Tom)

#### **Urgent & Upcoming Deadlines**
- **Prepare Roadmap Slides (Alice)**  
  *Due June 9 — Status: In Progress*  
  Priority: High  
  • Creating roadmap for planning sync  
  • **Action:** Share draft with Bob by EOD tomorrow

#### **Overdue**
- **Finalize Budget Estimates (Tom)**  
  *Due June 5 — Status: Not Started*  
  Priority: High  
  • Blocks executive review  
  • **Action:** Submit or flag blockers now

#### **In Progress**
- **Conduct User Interviews (Jin)**  
  *Due June 14 — Status: In Progress*  
  Priority: Medium  
  • 3 of 10 interviews complete  
  • **Action:** Schedule remaining this week

#### **Completed**
- **Team Poll for Code Name (All)**  
  *Completed June 6*  
  Priority: Low  
  • Team voted "Project Atlas"  
  • **Action:** None
```

---

### 📖 2. Explain Single Task

When explaining a task, respond naturally but with focus — like a teammate helping the user understand not just what the task is, but why it matters.

Organize the response using soft headings and bold text. Keep it readable and concise — just enough to orient the user.

Only include what’s actually available in the data. If a detail isn’t mentioned or returned by `getTaskDetails`, leave it out — no guessing.

Always include:

- **What this is about** – A clear, short summary of what the task involves  
- **What needs to happen** – The key actions, deliverables, or decisions expected  
- **Next step** – What should happen next, or how to move it forward  

Add other useful depending on available data only.

Avoid robotic labels like “Context” or “Status.” Instead, sound like a capable teammate explaining the task in a helpful, professional tone.

Don’t invent info — rely only on the real task data. 

Retrieved the task details using `getTaskDetails` tool.

#### Example (Single Task)

```markdown
Here’s a quick breakdown of what this task is about: 

**What this is about**  
This task is focused on preparing the Q2 performance report for the executive team. It includes compiling key metrics and summarizing departmental updates.

**What needs to happen**  
You’ll need to gather input from Finance, Sales, and Operations, then format the data into the quarterly report template. The final document should highlight trends, performance against targets, and any major risks.

**Next step**  
Reach out to each department head for their input by end of week, so you can begin drafting the report early next week.
```

#### 2.1 Explain Task List

When explaining a task list, write like a capable teammate giving a clear, focused update — structured around features, but easy to follow and human in tone.

Respond in well-organized but concise **paragraphs**, each covering a feature or area of focus. Use a mix of **natural explanation** and **bulleted tasks** when helpful — but only within the paragraph, not as a top-level list. The goal is to make the update skimmable, but not robotic.

Structure your explanation as follows:

1. **Opening line** — A brief summary of what this list is working toward  
2. **Concise Explation group per feature** - make sure this is readable, clean and scannable 
3. **Final paragraph** — A clear summary of what’s next or how to move forward overall


✅ Do:
- Explain tasks naturally, like a peer giving a stand-up update
- Group related work into clean paragraphs with optional inline bullets
- Keep tone professional, focused, and easy to scan
- Keep it concise, not too long not too short

---

#### ✅ Example (Grouped by Feature)

```markdown
Here’s a quick breakdown of what this task list is about:

This list focuses on wrapping up key features and polishing the product ahead of the sprint review.

First is the multi-step signup form. Most of the flow is complete, but a few critical items remain:
- Finalize validation for Step 2 — currently fails on invalid phone input
- Make resume upload optional in Step 4, as requested by UX
- Replace placeholder confirmation copy with the final version from Product

Next is the mobile dashboard update, centered around Camille’s new donut chart. The chart is ready and should replace the current earnings visualization. While implementing this, also:
- Fix the padding issue on the profile card for iOS — it's currently clipping on smaller screens
- Investigate the flicker on load — QA reports it's likely tied to animation delay timing

Finally, there are a few admin panel cleanups around role management:
- Remove deprecated roles from the dropdown list
- Add visual feedback when saving (loading spinner and success message)
- Ensure org admins can no longer assign themselves superadmin privileges

Once these are complete, the sprint can move into QA handoff and internal review before the demo.
```

---

### 🧩 3. Help (How to Tackle the Task)

When the user asks "how do I start", "what should I do", or "help me with" a task:

- Identify the task context
- Provide clear next steps or a checklist
- Include any helpful tips or best practices
- Be clear and actionable

**Example:**

```markdown
### Need Help: Conducting User Interviews

**Context:** You’ve been assigned to gather user feedback on the new onboarding flow.

**To get started:**
1. Define interview objectives (what insights you want)
2. Identify 8–10 target users from recent signups
3. Schedule interviews (15–30 mins each)
4. Prepare a short list of guiding questions
5. Use a tool like Zoom or Lookback to record sessions
6. Summarize findings in a shared doc

**Tip:** Focus on areas where users hesitated or dropped off.

**Action:** Create the outreach list and send first batch of invites today.

---

#### General Guidelines
1. ALways include the assignee details. Its important that the user can clearly see who is assigned to the task.
---

If user is asking for help on the tasks, give next steps and suggestions. Place it under each task, using enhanced formatting.

### New Meetings Added!, Here are the latest meeting, ordered from **latest to oldest**. Consider these first when generating tasks:

```json
$latestMeetings


✅ Interpretation Guidelines:
- These are the latest known meetings at the time of your reasoning.
- Treat this list as the **source of truth for recency** — if a user asks about the “latest meeting,” you must use the **first meeting in this list**.
- **Ignore any prior conversation context about meetings** — it may be outdated.

⚠️ Important: This is just a snapshot of the most recent meetings.
If the meeting the user is referring to is not listed above, you must call the `retrieveMeetings` or `findDataSource` tool to look it up in the full database.
Never assume a meeting doesn't exist based on this limited list alone.
EOD;
    }

    public function getFunctionCalls(): array
    {
        $tools = [
            RetrievalTools::findDataSource,
            RetrievalTools::retrieveMeetings,
            TaskTools::createTasks,
            TaskTools::createTaskList,
            TaskTools::queryTasks,
            TaskTools::searchAssignees,
            TaskTools::getTaskDetails,
            TaskTools::searchTasksAndTaskLists,
            TaskTools::updateTasks,
            TaskTools::deleteTask,
            TaskTools::communicateWithOtherAgents,
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

    /**
     * Handle function calls specific to Admin agents.
     *
     * @param string $functionName
     * @param array $arguments
     * @param mixed $orgId
     * @param mixed $pulseId
     * @param mixed $threadId
     * @param mixed $messageId
     * @return string
     *
     */

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info("[Task Manager Agent] {$functionName}  called", $arguments);

        switch ($functionName) {
            case 'retrieveMeetings':
                if ($arguments['filterType'] === 'most_recent') {
                    $meetings = Meeting::where('pulse_id', $pulseId)
                        ->whereNotNull('data_source_id')
                        ->latest()
                        ->take(5)
                        ->get();
                } elseif ($arguments['filterType'] === 'date_range') {
                    try {
                        $startDate = Carbon::parse(
                            $arguments['startDate'],
                        )->startOfDay();
                        $endDate = Carbon::parse(
                            $arguments['endDate'],
                        )->endOfDay();
                    } catch (\Throwable $th) {
                        Log::error("Error parsing date: {$th->getMessage()}");
                        return 'Invalid date format for either startDate or endDate. Please use YYYY-MM-DD and try calling this tool again.';
                    }

                    $meetings = Meeting::where('pulse_id', $pulseId)
                        ->whereNotNull('data_source_id')
                        ->whereBetween('date', [$startDate, $endDate])
                        ->orderBy('date', 'desc')
                        ->get();
                } else {
                    return "Invalid filter type. Please use 'most_recent', 'today', or 'date_range'.";
                }

                if (count($meetings) === 0) {
                    return 'No meetings found for the given date range.';
                }

                $meetingList = "Here are the meetings I found:\n";

                foreach ($meetings as $meeting) {
                    $formattedTime = Carbon::parse($meeting->date)
                        ->tz($this->user->timezone)
                        ->format('F j, Y');
                    $meetingList .= "{$meeting->title} held on {$formattedTime}. Data Source Id is \"{$meeting->data_source_id}\"\n";
                }

                $meetingList .= "Select one base on user query.\n";
                return $meetingList;

            case 'createTasks':
                $arguments = ToolParserHelper::sanitize($arguments);

                if (! empty($arguments['data_source_id'])) {
                    $is_valid = Uuid::isValid($arguments['data_source_id']);
                    if (! $is_valid) {
                        return 'Invalid data source ID. Please provide a valid UUID in data source id and call this tool again. Leave the field empty if source is not meeting';
                    }
                    return $this->handleTaskCreationFromMeeting(
                        $orgId,
                        $pulseId,
                        $threadId,
                        $arguments,
                    );
                }

                $entity = Pulse::find($pulseId);

                if (! empty($arguments['tasks'])) {
                    $pipeline       = new TaskPipeline($orgId, $pulseId);
                    $pipelineResult = $pipeline->run(
                        tasks: $arguments['tasks'],
                        autoAssign: false,
                    );
                    Log::debug(
                        '[Task Manager Agent] Task pipeline result',
                        $pipelineResult,
                    );

                    $uniqueParentIds = collect($pipelineResult['tasks'])
                        ->pluck('parent_id')
                        ->filter(fn ($id) => ! empty($id))
                        ->unique()
                        ->values();

                    // make sure all parent ids are valid if provided, return to orchestrator
                    foreach ($uniqueParentIds as $parent_id) {
                        try {
                            $parentTask = Task::find($parent_id);
                            if (! $parentTask) {
                                return "This task list {$parent_id} is invalid or not existing in our records. Make sure to pass valid id (UUID). Create or retrieve first the correct task list, then call this tool again.";
                            }

                            if ($parentTask->type->value === 'TASK') {
                                $this->interactiveUIEnabled = false;
                                return "This task list {$parent_id} provided is a type 'TASK' and not a task list. Task cannot have a sub tasks and task cannot be converted to a task list. DO not recommend to convert it to a task list since it is unsupported by system.";
                            }

                        } catch (\Throwable $th) {
                            return "This task list {$parent_id} is invalid or not existing in our records. Make sure to pass valid id (UUID). Create or retrieve first the correct task list, then call this tool again.";
                        }
                    }

                    $tasks = $this->validateTasks($pipelineResult['tasks']);
                    if (
                        empty($tasks) && ! empty($pipelineResult['duplicateTasks'])
                    ) {
                        return 'All the tasks you tried to create already exist in your task list, so no new tasks were added. Inform user with these existing tasks as well.' .
                            "\n\n" .
                            "Here are the tasks that already exist: \n\n" .
                            json_encode(
                                $pipelineResult['duplicateTasks'],
                                JSON_PRETTY_PRINT,
                            );
                    }

                    $created_tasks = [];

                    $parent_id = isset($taskList) ? $taskList->id : null;

                    foreach ($tasks as $task) {
                        $assignees = null;
                        if (! empty($task['assignees'])) {
                            $assignees = array_values(
                                array_map(function ($task) {
                                    return $task['id'];
                                }, $task['assignees']),
                            );
                        }

                        $data = new TaskData(
                            title: $task['title'],
                            description: $task['description'] ?? null,
                            category_id: $task['category_id'] ?? null,
                            organization_id: $orgId,
                            status: $task['status']     ?? null,
                            priority: $task['priority'] ?? null,
                            due_date: $task['due_date'] ?? null,
                            type: $task['task_type'],
                            parent_id: $task['parent_id'] ?? null,
                            assignees: $assignees         ?? null,
                        );

                        if ($this->recommendation) {
                            $this->saveRecommendationAction(
                                'task',
                                'create',
                                $data->all()
                            );
                        } else {
                            $created_tasks[] = $this->createTaskAction->handle(
                                entity: $entity,
                                data: $data,
                            );
                        }
                    }

                    $extract_props_to_return = array_map(function ($item) {
                        return [
                            'id'              => $item->id,
                            'title'           => $item->title,
                            'description'     => $item->description,
                            'category_id'     => $item->category_id,
                            'organization_id' => $item->organization_id,
                            'status'          => $item->status,
                            'priority'        => $item->priority,
                            'due_date'        => $item->due_date,
                            'parent_id'       => $item->parent_id,
                            'type'            => $item->type,
                            'created_at'      => $item->created_at,
                            'updated_at'      => $item->updated_at,
                        ];
                    }, $created_tasks);

                    $ids = collect($created_tasks)->pluck('id');

                    if (!$this->recommendation) {
                        TaskCreatedEvent::dispatch($pulseId, [
                            'message' => 'Task created',
                            'status'  => 'success',
                            'data'    => [
                                'ids' => $ids,
                            ],
                        ]);
                    }

                    $jsonTasks = json_encode(
                        $extract_props_to_return,
                        JSON_PRETTY_PRINT,
                    );

                    $duplicatedTasksPrompt = '';
                    if (! empty($pipelineResult['duplicateTasks'])) {
                        $duplicatedTasks = json_encode(
                            $pipelineResult['duplicateTasks'],
                            JSON_PRETTY_PRINT,
                        );
                        $duplicatedTasksPrompt = "These tasks are already existing in our task records, they are not recreated. Inform user with these existing tasks as well on your response, include references: \n\n {$duplicatedTasks}";
                    }

                    $response = <<<EOT
Task successfully created. Here's the updated tasks records with proper ids supplied. Refer to this data if needed in the following user query.
DO NOT show to the user these ID's use only for internal communication of your tools.

$jsonTasks

{$duplicatedTasksPrompt}
EOT;

                    return $response;
                }

                return 'Task is not created, did you pass the correct parameters?. Try again with correct one if not';

            case 'findDataSource':
                $handler = new DataSourceHandler($orgId, $pulseId);

                $search_results = $handler->search($arguments['query']);
                if (! $search_results) {
                    return "No relevant information is found in the documents, respond with: 'I couldn't find any relevant information in the documents to answer your question. If you've already uploaded the document, it might still be processing and will be available later.";
                }
                return $search_results;

            case 'queryDatabase':
                $results = TaskQueryBuilder::fromIntent($arguments, $pulseId);
                $results = TaskQueryBuilder::parseTaskDatesToUserTimezone(
                    $results,
                    $this->user->timezone,
                );

                $formattedJson = "Here is the result from the database:\n\n";
                $formattedJson .= "```json\n";
                $formattedJson .= json_encode($results, JSON_PRETTY_PRINT);
                $formattedJson .= "\n```";

                return $formattedJson;

            case 'searchAssignees':
                if (empty($arguments['name'])) {
                    return 'Please provide a valid name to search for assignees.';
                }

                $results = User::where('name', 'ILIKE', "%{$arguments['name']}%")
                    ->whereHas('pulseMemberships', function ($query) use (
                        $pulseId
                    ) {
                        $query->where('pulse_id', $pulseId);
                    })
                    ->select('id', 'name', 'email')
                    ->get();

                if ($results->count() === 0) {
                    return 'No assignees found for the given name.';
                }
                
                return json_encode($results, JSON_PRETTY_PRINT);

            case 'queryTasks':
                $query = Task::query()
                    ->with('assignees.user:id,name,email')
                    ->where('organization_id', $orgId)
                    ->where('entity_id', $pulseId);
                    
                if (!empty($arguments['task_query_kind']) && in_array($arguments['task_query_kind'], ['TASK', 'TASK_LIST', 'BOTH'])) {
                    switch ($arguments['task_query_kind']) {
                        case 'TASK':
                            $query->where('type', 'TASK');
                            break;
                        case 'TASK_LIST':
                            $query->where('type', 'LIST');
                            break;
                    }
                } else {
                    $query->where('type', '!=', 'LIST');
                }

                if (!empty($arguments['status'])) {
                    $status = $arguments['status'];
                    if (in_array('OVERDUE', $arguments['status'])) { 
                        $query->whereDate('due_date', '<', now()->toDateString());

                        // remove the overdue status from the status array
                        $status = array_values(array_diff($status, ["OVERDUE"]));
                    }

                    if (!empty($status)) {
                        $query->when($status, function ($q) use ($status) {
                            $q->whereIn('status', (array) $status);
                        });
                    }
                } else {
                    $query->applyCompletionTimeFilter();
                }

                if (!empty($arguments['assignee_id'])) {
                    if ($arguments['assignee_id'] === 'UNASSIGNED') {
                        $query->whereDoesntHave('assignees');
                    } else {
                        $isValid = Uuid::isValid($arguments['assignee_id']);
                        if (! $isValid) {
                            return 'Invalid assignee id. Please find the user id first and call this tool again.';
                        }
                        $query->filterByAssignee($arguments['assignee_id']);
                    }
                }

                if (!empty($arguments['query_unassigned'])) {
                    $query->whereDoesntHave('assignees');
                }

                if (!empty($arguments['priority'])) {
                    $query->filterByPriority($arguments['priority']);
                }

                if (!empty($arguments['due_date'])) {
                    $query->filterByDueDate($arguments['due_date']);
                }

                if (!empty($arguments['due_date_range'])) {
                    $query->filterByDateRange($arguments['due_date_range']);
                }

                if (!empty($arguments['search'])) {
                    $query->filterBySearch($arguments['search']);
                }

                if (!empty($arguments['updated_at'])) {
                    if (!empty($arguments['updated_at']['from'])) {
                        $query->where('updated_at', '>=', Carbon::parse($arguments['updated_at']['from']));
                    }
                    if (!empty($arguments['updated_at']['to'])) {
                        $query->where('updated_at', '<=', Carbon::parse($arguments['updated_at']['to']));
                    }
                }

                $query->select('id', 'title', 'description', 'type', 'status', 'priority', 'due_date', 'parent_id', 'created_at', 'updated_at');
                $results = $query->get();
                $parsedResults = $this->parseTasks($results, $this->user->timezone);

                //  if filter does not exist, unsupported response
                return json_encode($parsedResults, JSON_PRETTY_PRINT);

            case 'updateTasks':
                Log::info(
                    '[Task Manager Agent] updateTasks  called',
                    $arguments,
                );

                $helper  = new UpdateTasksHelper($orgId, $pulseId);

                if ($this->recommendation) {
                    $this->saveRecommendationAction(
                        'task',
                        'update',
                        $arguments['tasks']
                    );
                } else {
                    $results = $helper->execute($arguments['tasks']);
                }


                if (empty($results['errors'])) {
                    return 'All tasks are updated. Inform user with friendly message.';
                }

                if (empty($results['success'])) {
                    return 'Failed to update tasks. Inform user with friendly message. Make sure pass correct arguments and call the tool again';
                }

                $failedTasks = json_encode($results['errors']);
                $response    = "Sucess updating tasks, However some updates failed.\n\n";
                $response .= "Here are the tasks that failed: {$failedTasks}\n\n";
                $response .= 'Make sure pass correct arguments and call the tool again';

                // no break
            case 'communicateWithOtherAgents':
                $response = "This agent wants to communicate with other agents to proceed.\n\n";
                $response .= json_encode($arguments, JSON_PRETTY_PRINT);
                $response .= "\n\nReturn this as final response. DO not call other tools for now. Later, You will be called again with complete data provided.";

                return $response;

            case 'getTaskDetails':
                $id      = $arguments['id'] ?? null;

                if (empty($id)) {
                    return 'No task id provided. Please provide a valid task id and call this tool again.';
                }

                $isValid = Uuid::isValid($id);
                if (! $isValid) {
                    return <<<TEXT
Invalid task or task list id. Retrieve the task first and call this tool again.

Is the task or task list generated from meeting? If so, Its possible that the tasks are still on draft for review atm. For the meantime answer user question based on available data if present.
TEXT;
                }

                $task = Task::with([
                    'assignees.user' => function ($query) {
                        $query->select('id', 'name', 'email');
                    },
                    'children.assignees.user' => function ($query) {
                        $query->select('id', 'name', 'email');
                    },
                ])->find($id);

                if (! $task || $task->count() === 0) {
                    return 'Invalid task or task list id. Retrieve the task first and call this tool again.';
                }

                if ($task->type->value === 'LIST') {
                    return "You passed in a task list id. Query the tasks with this id as parent if you want to know the tasks of the task list.";
                }

                if ($task->type->value === 'TASK' && $task->source_id === null) {
                    return "No additional details found. Proceed with the current task details.";
                }

                $details = TaskPipeline::explainTask($task, $task->source_id, $orgId, $pulseId);

                return $details;

            case 'createTaskList':
                if (empty($arguments['title'])) {
                    return 'provide valid task list title';
                }

                if (!empty($arguments['checked_existence']) && $arguments['checked_existence'] == false) {
                    return "Looks like you have not checked if the task list already exists. Please call searchTasksAndTaskLists tool first to check if the task list already exists. Call this tool again if confirmed that the task list does not exist.";
                }

                $entity = Pulse::find($pulseId);
                $title  = $arguments['title'];

                $taskList = Task::select('id', 'title', 'entity_id', 'status')
                    ->where('entity_id', $pulseId)
                    ->where('title', 'ILIKE', $title)
                    ->first();

                if (! $taskList) {
                    $data = new TaskData(
                        title: $title,
                        organization_id: $orgId,
                        type: 'LIST',
                        status: TaskStatus::TODO->value,
                        priority: TaskPriority::LOW->value,
                    );

                    $taskList = $this->createTaskAction->handle(
                        entity: $entity,
                        data: $data,
                    );

                    TaskCreatedEvent::dispatch($pulseId, [
                        'message' => 'Task created',
                        'status'  => 'success',
                        'data'    => [
                            'ids' => [$taskList->id],
                        ],
                    ]);
                }

                $taskList = [
                    'id'          => $taskList->id,
                    'title'       => $taskList->title,
                    'description' => $taskList->description ?? 'no description set',
                ];

                return json_encode($taskList, JSON_PRETTY_PRINT);

            case 'searchTasksAndTaskLists':
                $query = Task::with([
                    'assignees.user' => function ($query) {
                        $query->select('id', 'name', 'email');
                    },
                    'children.assignees.user' => function ($query) {
                        $query->select('id', 'name', 'email');
                    },
                ])
                    ->where('entity_id', $pulseId)
                    ->where('organization_id', $orgId);
                $query->where(function ($q) use ($arguments) {
                    $q->orWhereRaw(
                        "to_tsvector('english', title) @@ plainto_tsquery('english', ?)",
                        [$arguments['query']],
                    )->orWhereRaw(
                        "to_tsvector('english', description) @@ plainto_tsquery('english', ?)",
                        [$arguments['query']],
                    );
                });
                $results = $query->orderBy('created_at', 'desc')->get();

                if ($results->count() > 0) {
                    $transformedResults = $results->map(function ($task) {
                        $returnData = [
                            'task_id' => $task->id,
                            'title'   => $task->title,
                            'type'    => $task->type->value,
                        ];

                        if ($task->type->value === 'TASK') {
                            $returnData['status']    = $task->status->value ?? null;
                            $returnData['assignees'] = $task->assignees->pluck(
                                'user.name',
                            );
                        }

                        return $returnData;
                    });
                    return json_encode($transformedResults, JSON_PRETTY_PRINT);
                }

                $pc        = new VectorDBService();
                $embedding = VectorDBService::getEmbedding($arguments['query']);
                $matches   = $pc->query(
                    $embedding,
                    $orgId,
                    "tasks:{$pulseId}",
                    5,
                );

                $matchesFilteredByScore = array_filter($matches, function (
                    $match,
                ) {
                    return $match['score'] >= 0.55;
                });

                $matchesParsed = array_map(function ($match) {
                    $matchTask = $match['metadata'];
                    $task      = [
                        'title'       => $matchTask['title'],
                        'description' => $matchTask['description'] ?? 'no description set',
                        'task_id'     => $matchTask['task_id'],
                        'type'        => $matchTask['type'],
                    ];

                    if ($matchTask['type'] === 'TASK') {
                        $task['due_date'] = ! empty($matchTask['due_date'])
                            ? Carbon::parse($matchTask['due_date'])->format(
                                'F j, Y',
                            )
                            : 'no due date';
                        $task['priority']  = $matchTask['priority'];
                        $task['status']    = $matchTask['status'];
                        $task['parent_id'] = $matchTask['parent_id'] ?? 'task not in a list';
                        return $task;
                    }

                    return $task;
                }, $matchesFilteredByScore);

                return "here are the matches for the query: \n\n" .
                    json_encode(
                        array_values($matchesParsed),
                        JSON_PRETTY_PRINT,
                    );

            case 'deleteTask':
                try {
                    $ids = $arguments['ids'] ?? [];
                    $validator = Validator::make(
                        ['ids' => $ids],
                        [
                            'ids'   => 'required|array|min:1',
                            'ids.*' => 'required|uuid',
                        ]
                    );
                    if ($validator->fails()) {
                        return 'One or more IDs are not valid UUIDs.';
                    }

                    $tasks = Task::whereIn('id', $ids)
                        ->where('organization_id', $orgId)
                        ->where('entity_id', $pulseId)
                        ->get();
                    
                    if ($this->recommendation) {
                        $this->saveRecommendationAction(
                            'task',
                            'delete',
                            $tasks->map->id->toArray()
                        );
                    } else {
                        if ($tasks->count() !== count($ids)) {
                            return 'One or more IDs do not exist in the database, make sure to get the correct task first and ask for confirmation first then call the tool again.';
                        }

                        if (isset($arguments['confirmed']) && $arguments['confirmed']) {
                            $tasks = Task::whereIn('id', $ids)
                                ->where('organization_id', $orgId)
                                ->where('entity_id', $pulseId)
                                ->get();

                            $tasks->each->delete();
                            return 'Task deleted successfully.';
                        }

                        return "Confirm this action to user first";
                    }
                } catch (\Exception $e) {
                    return 'Error deleting tasks, make sure to get the correct task first and ask for confirmation first then call the tool again.';
                }

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

    public function injectActivityLogs(Collection $formattedMessages): Collection
    {
        try {
            $activityLogParser = new ActivityLogParser(
                $this->user,
                $this->pulse->id,
            );
            // from timestamp should 5 minutes before the last user message, formattedMessages is ordered by old to latest
            $fromTimestamp = "";
            if ($formattedMessages->count() === 0) {
                return $formattedMessages;
            }
            
            $lastUserMessage = $formattedMessages->filter(function ($message) {
                return isset($message['role']) && $message['role'] === 'user';
            })->last();
            
            if ($lastUserMessage && isset($lastUserMessage['created_at'])) {
                $lastMessageTime = Carbon::parse($lastUserMessage['created_at']);
                $fromTimestamp = $lastMessageTime->subMinutes(5)->toISOString();
            } else {
                return $formattedMessages;
            }
                
            $activityLogs = $activityLogParser->parse([Task::class], $fromTimestamp);

            $processor      = new ActivityLogMessageProcessor();
            $mergedMessages = $processor->processMessagesWithActivityLogs(
                $formattedMessages->toArray(),
                $activityLogs,
            );

            return collect($mergedMessages);
        } catch (\Throwable $th) {

            Log::warning(
                'Encountered problem injecting activity logs, disabled for current request',
                [
                    "message" => $th->getMessage(),
                    "messageHistory" => $formattedMessages->toArray(),
                    "activityLogs" => $activityLogs ?? [],
                ],
            );
        }
        
        return $formattedMessages;
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last = $messages->last();
        $text = $last['content'] ?? '';

        return $this->processSystemThread(
            'taskAgent',
            $messages->last()['content'] ?? '',
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }

    private function handleTaskCreationFromMeeting(
        string $organizationId,
        string $pulseId,
        string $threadId,
        array $arguments,
    ) {
        $summary = Summary::where(
            'data_source_id',
            $arguments['data_source_id'],
        )
            ->orderBy('created_at', 'asc')
            ->first();

        if (! $summary) {
            $summaryObj = $this->generateSummary($arguments['data_source_id']);
            if (! $summaryObj) {
                return 'Cannot create the tasks at the moment, Respond like this to the user. "[name of the meeting] doesnt have meeting transcript."';
            } else {
                $action_items = $summaryObj['action_items'] ?? [];
                if (! empty($action_items)) {
                    $tasks = $this->processMeetingTasks(
                        $action_items,
                        $organizationId,
                        $pulseId,
                    );
                } else {
                    $tasks = [];
                }

                $summary = Summary::create([
                    'name'                 => $summaryObj['metadata']['meeting_name'] . ' Summary',
                    'pulse_id'             => $pulseId,
                    'user_id'              => $this->user->id,
                    'data_source_id'       => $arguments['data_source_id'],
                    'date'                 => $summaryObj['metadata']['meeting_date'],
                    'attendees'            => $summaryObj['metadata']['attendees'],
                    'action_items'         => json_encode($tasks),
                    'potential_strategies' => json_encode(
                        $summaryObj['potential_strategy'] ?? [],
                    ),
                    'summary' => MarkdownParser::clean($summaryObj['summary']),
                ]);
            }
        }

        if (empty($summary->action_items)) {
            // handle edge case, add if not exist
            $summaryObj = $this->generateSummary($arguments['data_source_id']);
            $action_items = $summaryObj['action_items'] ?? [];
            if (! empty($action_items)) {
                $tasks = $this->processMeetingTasks(
                    $action_items,
                    $organizationId,
                    $pulseId,
                );
            } else {
                $tasks = [];
            }

            $summary->action_items = json_encode($tasks);
            $summary->save();
        }

        CreateCompletionService::registerCallback(function (
            string $organizationId,
            Thread $thread,
            User $user,
            Message $message,
        ) use ($arguments, $summary) {
            $meeting = Meeting::where(
                'data_source_id',
                $arguments['data_source_id'],
            )->first();
            $formattedDate = Carbon::parse($meeting->date)->format('F j, Y');
            $message       = "$meeting->title Tasks Drafted. – {$formattedDate}";

            $currentDatetime = now()->addSecond();
            $ai_payload      = [
                'content' => json_encode([
                    'type'    => 'review_tasks',
                    'message' => $message,
                    'data'    => [
                        'summary_id' => $summary->id,
                    ],
                ]),
                'organization_id' => $organizationId,
                'role'            => 'assistant',
                'thread_id'       => $thread->id,
                'user_id'         => $user->id,
                'status'          => MessageStatus::COMPLETE,
                'created_at'      => $currentDatetime,
                'updated_at'      => $currentDatetime,
            ];

            Message::create($ai_payload);
        });

        $tasksjson                  = json_encode($summary->action_items);
        $this->interactiveUIEnabled = false;

        return <<<EOD
Success creating tasks. Inform the user with simple response without listing the tasks again. (i.e "Drafted action items for tasks discussed in the **[Meeting Title] - [Meeting Date]**. You can now make edit as needed.")

Here are the tasks created: (dont include this in the response)
<pre>
$tasksjson
</pre>
EOD;
    }

    public function processMeetingTasks(
        array $action_items,
        string $organizationId,
        string $pulseId,
    ) {
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

        $pipeline       = new TaskPipeline($organizationId, $pulseId);
        $pipelineResult = $pipeline->run($action_items);
        Log::debug(
            '[Task Manager Agent] Task pipeline result',
            $pipelineResult,
        );

        $tasks = $this->validateTasks($pipelineResult['tasks']);

        $duplicatedTasks = collect($pipelineResult['duplicateTasks'])
            ->map(function ($task) {
                $task['is_existing'] = true;
                unset($task['matches']);
                return $task;
            })
            ->values()
            ->all();

        $tasks = array_merge($tasks, $duplicatedTasks);

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

        return $tasks;
    }

    private function generateSummary(string $dataSourceId)
    {
        $transcript = Transcript::where(
            'data_source_id',
            $dataSourceId,
        )->first();

        if (! $transcript) {
            return null;
        }

        $summaryObj = $this->meetingHelper->generateSummary(
            $transcript->content,
            $this->user->id,
        );

        return $summaryObj;
    }

    public function validateTasks($tasks)
    {
        return array_map(function ($task) {
            $assignees = ! empty($task['assignees']) ? $task['assignees'] : null;
            if ($assignees) {
                $assignees = $this->processAssignees($assignees);
            }

            $dueDate = ! empty($task['due_date']) ? $task['due_date'] : null;

            // Ensure title is not empty
            $title = $task['title'] ?? '';
            if (empty(trim($title))) {
                $title = 'Untitled Task';
            }

            return [
                'title'       => $title,
                'description' => ! empty($task['description'])
                    ? $task['description']
                    : null,
                'assignees' => $assignees,
                'status'    => ! empty($task['status']) ? $task['status'] : 'TODO',
                'priority'  => ! empty($task['priority'])
                    ? $task['priority']
                    : 'MEDIUM',
                'due_date'  => $this->processDueDate($dueDate),
                'task_type' => ! empty($task['task_type'])
                    ? $task['task_type']
                    : 'TASK',
                'parent_id' => ! empty($task['parent_id'])
                    ? $task['parent_id']
                    : null,
            ];
        }, $tasks);
    }

    protected function processAssignees(array $assignees): array
    {
        return array_filter(
            array_map(function ($assignee) {
                if (empty($assignee['name'])) {
                    return null;
                }

                if (
                    ! empty($assignee['id']) && ! Uuid::isValid($assignee['id'])
                ) {
                    $assignee['id'] = null;
                }
                return $assignee;
            }, $assignees),
        );
    }

    protected function processDueDate($dueDate)
    {
        if (empty($dueDate)) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($dueDate)->startOfDay();
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseTasks(Collection $tasks, string $timezone): array
    {
        $tasksArray = $tasks->toArray();

        foreach ($tasksArray as &$task) {
       
            if (!empty($task['due_date'])) {
                $task['due_date'] = Carbon::parse($task['due_date'])
                    ->tz($timezone)
                    ->format('F j, Y');
            }

            if (!empty($task['created_at'])) {
                $task['created_at'] = Carbon::parse($task['created_at'])
                    ->tz($timezone)
                    ->format('F j, Y \a\t g:i A');
            }

            if (!empty($task['updated_at'])) {
                $task['updated_at'] = Carbon::parse($task['updated_at'])
                    ->tz($timezone)
                    ->format('F j, Y \a\t g:i A');
            }

            if (!empty($task['assignees'])) {
                $task['assignees'] = array_map(function ($assignee) {
                    return [
                        'id'    => $assignee['user']['id'] ?? null,
                        'name'  => $assignee['user']['name'] ?? null,
                        'email' => $assignee['user']['email'] ?? null,
                    ];
                }, $task['assignees']);
            }
        }

        return $tasksArray; 
    }
}
