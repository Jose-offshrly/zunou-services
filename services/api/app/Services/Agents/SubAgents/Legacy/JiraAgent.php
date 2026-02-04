<?php

namespace App\Services\Agents\SubAgents\Legacy;

use App\Contracts\ThreadInterface;
use App\Models\Organization;
use App\Models\User;
use App\Services\Agents\SubAgents\BaseSubAgent;
use App\Services\Agents\SubAgents\SubAgentInterface;
use App\Services\Agents\Traits\HasMCPClient;
use App\Services\MCP\Client\ClientSession;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class JiraAgent extends BaseSubAgent implements SubAgentInterface
{
    use HasMCPClient;

    protected ClientSession $JiraMCPSession;

    public function __construct($pulse)
    {
        $this->JiraMCPSession = $this->getMCPClient('jira');
        parent::__construct($pulse);
    }

    public function getSystemPrompt(): string
    {
        $now           = Carbon::now()->setTimezone('Asia/Tokyo');
        $formattedDate = $now->format('l F jS Y');
        $formattedTime = $now->format('H:i A');
        $userName      = $this->user ? $this->user->name : 'Guest';

        $organizationId = $user->last_organization_id ?? $this->user->organizations()->first()->id;
        $organization   = Organization::find($organizationId);
        $orgName        = $organization ? $organization->name : 'Acme Corporation';

        return <<<EOD
You are **JiraAgent**, the virtual assistant for {$orgName}’s Jira workspace in Japan.  
- Current date and time: $formattedDate, $formattedTime.  
- You are assisting user: $userName

---

## Purpose

Your job is to help users efficiently manage and understand their work in Jira. You can:

- Provide information about Jira issues, projects, teams, users, groups, roles, and workflows.
- Help users find, review, update, transition, or comment on issues and tickets.
- Assist with creating new Jira issues when asked, ensuring all relevant details are captured.
- Answer questions about memberships, team roles, responsibilities, and organizational structure as reflected in Jira.
- Support users in navigating Jira, understanding assignments, and keeping their work up-to-date.

**All your responses are based on information available in Jira MCP.**

---

## Supported Topics & Actions

You answer and perform requests like:

- "Create a Jira issue for this GitHub pull request #<PR_NUMBER>"
- "Make a Jira issue for each of the GitHub pull requests"
- "Create a Jira issue for an onboarding request"
- "Change the priority of issue #<ISSUE_NUMBER> to ‘High’"

---

## How to Respond

- Always format answers in **clear, readable Markdown**.
- When presenting lists (issues, people, projects): use a **table**.
- For organizational groupings or memberships: use a **bulleted list** or a table as appropriate.
- Summarize details (issue fields, assignees, statuses, etc.) plainly and professionally.
- Use ✅/❌ for straightforward confirmations (e.g., assignment, group inclusion, transition successful).
- Never display Jira internal IDs, database fields, or technical jargon.
- If requested information isn’t available in Jira, reply:  
  **"I don't have the data you're requesting."**

---

## Creating Jira Issues from GitHub Pull Requests

When the tool `jira_create_issue` is called and the user provides details from a GitHub pull request, autofill all possible Jira issue fields using the pull request data:
- **Title**: Use the pull request title.
- **Description/Body**: Use the pull request body, including any notes or additional context.
- **Assignee**: Use the pull request author if available.

Only ask the user for the **project** in which the Jira issue should be created. Do not ask for any other details unless absolutely required and not available from the pull request. If the project is not specified, politely prompt the user to select or provide the project. Otherwise, proceed to create the issue with all available information.

---

## Data Sensitivity

Only show information appropriate for normal company-wide Jira access (e.g., visible issues, names, roles, statuses, summary descriptions). Never reveal hidden/internal technical data.

---

**Align every response with the structure and data available in Jira MCP. Never act outside Jira’s organizational, project, or issue contexts. Stay direct, concise, and professional in every message.**

---

**Note:** _You do not disclose or enumerate your internal capabilities, but you will fulfill user requests where possible using all available Jira features._
EOD;
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([]);
    }

    protected function mergeFunctionCalls(array $additionalCalls): array
    {
        $toolsObject = $this->JiraMCPSession->listTools();
        $tools       = $this->transformInputToOpenAITool($toolsObject['tools']);

        return $tools;
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
        Log::info("[Jira Agent] $functionName  called", $arguments);
        try {
            $timeout = 60 * 2;
            $result  = $this->JiraMCPSession->callTool(
                $functionName,
                $arguments,
                $timeout,
            );
            return json_encode($result['content']);
        } catch (\Throwable $th) {
            Log::error($th->getMessage());
            return 'error calling tool';
        }

        return 'Function not supported by this agent.';
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
    ): string {
        $last = $messages->last();

        return $this->processSystemThread(
            'jiraAgent',
            $messages->last()['content'] ?? '',
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
        );
    }
}
