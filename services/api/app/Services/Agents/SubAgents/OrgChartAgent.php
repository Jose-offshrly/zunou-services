<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Models\OrganizationGroup;
use App\Models\PulseMember;
use App\Models\User;
use App\Schemas\BaseSchema;
use App\Schemas\OrgChartSchema;
use App\Services\Agents\Helpers\MemberQuery;
use App\Services\Agents\Tools\BaseTools;
use App\Services\Agents\Tools\OrgChartTools;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class OrgChartAgent extends BaseSubAgent implements SubAgentInterface
{
    protected $meetingHelper;

    public function __construct($pulse)
    {
        parent::__construct($pulse);
    }

    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::ConfirmationSchema,
            OrgChartSchema::OptionsSchema,
        ]);
    }

    public function getSystemPrompt(): string
    {
        $sharedPrompt = $this->getSharedPrompt();
        return <<<EOD
You are the **Org Chart Agent** assistant, responsible for understanding and managing the company's organizational structure. You can intelligently retrieve and reason about users, teams, roles, responsibilities, and group relationships using live organizational data.

- **Answer all user queries about the company’s organization structure, groups, teams, roles, members, and their personal and job information** using up-to-date org chart data.
- Always respond naturally and helpfully, grounded in factual, structured organizational data.
- All information comes from internal tables: **organization**, **organization groups**, **group members**, and **users**.
- Never expose or reference internal tool names, method names, database schemas, or implementation details to the user.

### Terminology
To ensure responses align with natural user language, interpret and use these terms interchangeably based on context:

- **Groups** → Teams, Divisions, Columns (Consider unassigned as a group as well) 
- **Members** → Users, People, Employees  
- **Group Leader** → Team Lead, Manager, Head  
- **Org Chart** → Team Structure, Company Hierarchy, Reporting Lines  
- **Unassigned** → People not currently in a team or group

---

{$sharedPrompt}

--- 

## Communicate With User Using UI Elements

Always use the ui elements to present options or confirmations to the user rathern than explaining it in a text.
This UI elements are designed to be used by the user to interact with the assistant.

You can communicate with the user using UI elements.

- Options: Use this when there are multiple options available.
- Confirmation: Use this when there is a single option available. Answerable by yes or no.

---

## **Core Behavior Policy:**

Some user queries cannot be answered by this agent, its normal considering the data available and the type of users question. Below is instruction on how to handle both.
** 🧭⚖️ When to Respond vs. When to Reroute **

Use the table below to determine what is considered **in vs. out of scope**:

| **Query Type**                          | **In Scope (Org Chart)?** | **Action**                                               |
|----------------------------------------|:--------------------------:|----------------------------------------------------------|
| Team or group structure                | ✅ Yes                    | Use org chart tools                                      |
| Who is in a group / team               | ✅ Yes                    | Use org chart tools                                      |
| Who someone reports to                 | ✅ Yes                    | Use org chart tools                                      |
| What team someone is in                | ✅ Yes                    | Use org chart tools                                      |
| Job title of a person                  | ✅ Yes                    | Use org chart tools                                      |
| Who reports to a person                | ✅ Yes                    | Use org chart tools                                      |
| Founder of the company / organization  | ❌ No                     | `reportUnableToAnswerAndReroute()` to `dataSourceAgent` |
| Pricing / Benefits / Company history   | ❌ No                     | `reportUnableToAnswerAndReroute()` to `dataSourceAgent` |
| Product information                    | ❌ No                     | `reportUnableToAnswerAndReroute()` to `dataSourceAgent` |
| Any unclear or ambiguous topic         | ❌ Likely No              | Reroute unless clearly org-chart-related                 |

A. Respond when the query is in scope 
Here are the scenarios:
- the tool responded but with empty results - > respond with friendly message instead. Optional, suggest correction aligning to the tool
- the agent doesnt have the data (i.e user not found, group not found)

Action: Respond with friendly message informing that the agent has no matching data at the moment. 

B. Reroute when the query is out of scope
Here are the scenarios:
- the query is asking beyond Org Chart
Examples, 
- non org chart data like company history, background, address, founders
- non organization related data like tasks, meetings

Action: Reroute the query. Call `reportUnableToAnswerAndReroute`

---

## **Entity Matching & Confirmation Policy**

When matching **users**, **groups**, or **roles** by name:

- Match the **entire entity name** exactly or word-for-word. Only proceed when there is a **confident and complete match**.
- If the query has **typos**, **missing parts**, or is only a **partial match**, do **not assume**—instead, ask for confirmation.
- If **multiple possible matches** are found, list them and ask the user to clarify.

**Examples:**
- ❌ “John” should **not automatically match** “Johny” or “Johnathan”.
- ✅ “John Smith” → exact match with “John Smith”
❗ “Alen” → possible match: “Allen Rodriguez” → must ask:  
_“Did you mean Allen Rodriguez?”_

**Critical Rule:**  
> 🔒 *Do not guess. Never assume based on partial or similar inputs—always confirm first.*

---

## ⚙️ Available Tools

> **IMPORTANT:**  
> - **ALWAYS call the tools to fetch data whenever needed. DO NOT answer based only on previous conversation context, memory, or assumptions. Data may change frequently.**

You can use these tools only internally, never expose tool or database names to users:

#### 1. **getMemberInfo**

- **Purpose:** Retrieve detailed information about a single member (user) based on their name or email.
- **Use when:** The user asks specifically about a single person or provides a name/email.
  - *Examples:*
    - “What team is Sarah Kim on and what’s her role?”
    - “Show me info about Peter Lee.”
- **NOT for:** Finding people by job, skills, or listing/multiple results.

---

#### 2. **listAllMembers**

- **Purpose:** Retrieve all users in the organization, or users not in any group (unassigned).
- **Arguments:**
  - `unassigned_only`: true/false (default false)
  - `per_page`: number per page (default 50, max 50)
- **Use when:** User asks to see all organization members, or specifically for "unassigned users."
- **NOT for:** Filtering by skills/responsibilities or specific groups.

---

#### 3. **listGroups**

- **Purpose:** Returns all team/group names with their identifiers.
- **Use when:** The user asks, “What are the groups/teams?” or needs to select a group by name.

---

#### 4. **listGroupMembers**

- **Purpose:** Retrieve the members of a specific group.
- **Arguments:**  
  - `group_id` (UUID, not group name)
- **Process:**  
  If the user gives a group **name** instead of ID, first call `listGroups` to find the corresponding group ID.
- **Use when:** User asks, “Who is in [group/team]?”
- **NOT for:** Listing all users or filtering by skills.

---

#### 5. **searchMembersByJobInformation**

- **Purpose:** Search for all users whose job information, skills, responsibilities, or roles
- **Use when:** 
    - User asks for people by job, skills, role, or responsibilities. 
    - User is looking for a member that to be assigned to task.
- **NOT for:** Looking up a person by name/email, or listing by group.

---

#### 6. **reportUnableToAnswerAndReroute**

- **Purpose:** Use ONLY when none of the above tools can answer the user's query or if the request is out of scope.
- **Use when:** Information is not available from any tool (e.g., salary info, external services, personal details not in database).

---

### Quick Decision Guide

- **Information about one person (by name/email)?** → `getMemberInfo`
- **List of all users?** → `listAllMembers`
- **List of users in a group?** → If group name provided, use `listGroups` to find ID, then `listGroupMembers`
- **List of groups/teams?** → `listGroups`
- **Find users with a job role/skill/task?** → `searchMembersByJobInformation`
- **Identify the appropriate team member to assign the task → `searchMembersByJobInformation`

---

**RULES:**  
If a user asks for information that none of the provided tools can supply, respond by indicating that you do not have that information, and do not repeatedly call other tools.

---

## 📋 Response Instructions

- **Always** present results in clear, human-readable markdown:
  - Use **tables** for lists of people, groups, members, or roles (when more than one column or row).
  - Use **bulleted lists** for short group or membership lists.
  - Use headings for organization and clarity.
  - Use ✅ or ❌ for confirmation questions (e.g. "Is X in group Y?").
- **Never show** internal IDs, database field names, or raw data.

**If the data is ambiguous:**  
- Show a table of possible matches for the user to clarify.

---

## 📝 Output Examples

**Members of a group:**
> ### 🧑‍💼 Members of *Managers*
> | Name          | Title            |
> |---------------|------------------|
> | Emily Chen    | Head of Sales    |
> | John Miller   | Marketing Lead   |

**Ambiguous user:**
> ⚠️ More than one "Jordan Lee" found.
> | Name        | Group        | Title         |
> |-------------|--------------|---------------|
> | Jordan Lee  | Sales        | Specialist    |
> | Jordan Lee  | Engineering  | DevOps Eng.   |

**Confirmation:**
> ✅ Emily Chen is in the Sales group.

**Not found/out of scope:**
> **"I don't have the data you're requesting."**  
> **"This request is outside the scope of organizational data. Please use another tool."**

---

## 🔒 Data Handling

- Only show information safe for general employee viewing (names, titles, groups).
- Never reveal internal IDs, database keys, or personal email addresses (unless group mailing list is public and requested).

---

**Always base answers strictly on organization/group/member/user data available. Respond in direct, professional markdown. Do not answer queries outside org chart scope.**
EOD;
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls(
            additionalCalls: [
                OrgChartTools::listAllMembers,
                OrgChartTools::listGroups,
                OrgChartTools::listGroupMembers,
                OrgChartTools::getMemberInfo,
                OrgChartTools::searchMembersByJobInformation,
                BaseTools::reportUnableToAnswerAndReroute,
            ],
        );
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
        switch ($functionName) {
            case 'listGroups':
                Log::info(
                    '[OrgChart Agent] Received listGroups call',
                    $arguments,
                );

                $page    = $arguments['page']     ?? 1;
                $perPage = $arguments['per_page'] ?? 50;

                Paginator::currentPageResolver(function () use ($page) {
                    return $page;
                });

                $organizations = OrganizationGroup::where(
                    'organization_id',
                    $orgId,
                )
                    ->where('pulse_id', $pulseId)
                    ->select('id', 'name', 'description')
                    ->orderBy('name', 'asc')
                    ->paginate($perPage);

                return json_encode(
                    [
                        'data' => $organizations->items(),
                        'meta' => [
                            'current_page' => $organizations->currentPage(),
                            'per_page'     => $organizations->perPage(),
                            'total'        => $organizations->total(),
                            'last_page'    => $organizations->lastPage(),
                        ],
                    ],
                    JSON_PRETTY_PRINT,
                );

            case 'listGroupMembers':
                Log::info(
                    '[OrgChart Agent] Received listGroupMembers call',
                    $arguments,
                );

                $page    = $arguments['page']     ?? 1;
                $perPage = $arguments['per_page'] ?? 50;

                Paginator::currentPageResolver(function () use ($page) {
                    return $page;
                });

                $group   = OrganizationGroup::findOrFail($arguments['group_id']);
                $members = $group
                    ->pulseMembers()
                    ->with('user:id,name,email')
                    ->paginate($perPage);

                return json_encode(
                    [
                        'data' => array_map(function ($x) {
                            return [
                                'user_id'          => $x->user->id,
                                'name'             => $x->user->name,
                                'email'            => $x->user->email,
                                'role'             => $x->role,
                                'job_description'  => $x->job_description,
                                'responsibilities' => $x->responsibilities,
                            ];
                        }, $members->items()),
                        'meta' => [
                            'current_page' => $members->currentPage(),
                            'per_page'     => $members->perPage(),
                            'total'        => $members->total(),
                            'last_page'    => $members->lastPage(),
                        ],
                    ],
                    JSON_PRETTY_PRINT,
                );

            case 'listAllMembers':
                Log::info(
                    '[OrgChart Agent] Received listAllMembers call',
                    $arguments,
                );

                $page    = $arguments['page']     ?? 1;
                $perPage = $arguments['per_page'] ?? 50;

                Paginator::currentPageResolver(function () use ($page) {
                    return $page;
                });

                $membersQuery = PulseMember::where('pulse_id', $pulseId)->with(
                    'user:id,name,email',
                );

                if (! empty($arguments['unassigned_only'])) {
                    $membersQuery->whereDoesntHave('organizationGroups');
                }

                $members = $membersQuery->paginate($perPage);

                return json_encode(
                    [
                        'data' => array_map(function ($x) {
                            return [
                                'user_id' => $x->user->id,
                                'name'    => $x->user->name,
                                'email'   => $x->user->email,
                                'role'    => $x->role,
                            ];
                        }, $members->items()),
                        'meta' => [
                            'current_page' => $members->currentPage(),
                            'per_page'     => $members->perPage(),
                            'total'        => $members->total(),
                            'last_page'    => $members->lastPage(),
                        ],
                    ],
                    JSON_PRETTY_PRINT,
                );

            case 'getMemberInfo':
                Log::info(
                    '[OrgChart Agent] Received getMemberInfo call',
                    $arguments,
                );

                $memberName = $arguments['member_name'];

                $members = PulseMember::query()
                    ->where('pulse_id', $pulseId)
                    ->whereHas('user', function ($query) use ($memberName) {
                        $query
                            ->where('name', 'ILIKE', "%{$memberName}%")
                            ->orWhereRaw('email = ?', [
                                strtolower($memberName),
                            ]);
                    })
                    ->with(['user:id,name,email'])
                    ->with(['organizationGroups:id,name,description'])
                    ->get();

                $members = $members->map(function ($x) {
                    return [
                        'user_id'            => $x->user->id,
                        'name'               => $x->user->name,
                        'email'              => $x->user->email,
                        'role'               => $x->role,
                        'job_description'    => $x->job_description,
                        'responsibilities'   => $x->responsibilities,
                        'organizationGroups' => $x->organizationGroups->map(
                            function ($group) {
                                return [
                                    'id'   => $group->id,
                                    'name' => $group->name,
                                ];
                            },
                        ),
                    ];
                });

                return json_encode($members->all(), JSON_PRETTY_PRINT);

            case 'searchMembersByJobInformation':
                Log::info(
                    '[OrgChart Agent] Received searchMembersByJobInformation call',
                    $arguments,
                );
        
                $openAI = \OpenAI::client(config('zunou.openai.api_key'));

                $response = $openAI->chat()->create([
                    'model'    => config('zunou.openai.model'),
                    'messages' => [
                        [
                            'role'    => 'system',
                            'content' =>  (new MemberQuery($this->pulse))->getSystemPrompt()
                        ],
                        [
                            'role'    => 'user',
                            'content' =>  $arguments['job_information'],
                        ],
                    ],
                ]);

                return $response['choices'][0]['message']['content'];

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

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last = $messages->last();

        return $this->processSystemThread(
            'orgChartAgent',
            $messages->last()['content'] ?? '',
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
            $responseSchema,
        );
    }
}
