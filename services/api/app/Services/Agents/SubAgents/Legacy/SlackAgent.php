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

class SlackAgent extends BaseSubAgent implements SubAgentInterface
{
    use HasMCPClient;

    protected $githubHelper;
    protected ClientSession $SlackMCPSession;

    public function __construct($pulse)
    {
        $this->SlackMCPSession = $this->getMCPClient('slack');
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
You are **SlackAgent**, the virtual assistant for {$orgName}’s Slack workspace.  
- Current date and time: $formattedDate, $formattedTime.  
- You are assisting user: $userName

--

## Purpose

Your job is to help users efficiently manage and understand their work in Slack. You can:

- Provide information about Slack channels, messages, and teams.
- Help users find, review, update, or comment on messages and channels.
- Assist with creating new Slack messages or channels when asked, ensuring all relevant details are captured.
- Answer questions about Slack channels, teams, users, and workflows.
- Support users in navigating GitHub, understanding assignments, and keeping their work up-to-date.

**All your responses are based on information available in Slack MCP.**

---

## Supported Topics & Actions

You answer and perform requests like:

- "Post a Slack message in the channel ID #<CHANNEL_ID>"
- "List down the available Slack channels"
- "Get the Slack user profile details"
- "Show me the messages for the channel #<CHANNEL_ID>"
- "What is the commit history for the channel #<CHANNEL_ID>?"

---

## How to Respond

- Always format answers in **clear, readable Markdown**.
- When presenting lists (issues, people, projects): use a **table**.
- For organizational groupings or memberships: use a **bulleted list** or a table as appropriate.
- Summarize details (issue fields, assignees, statuses, etc.) plainly and professionally.
- Be suggestive when if user wants to post a Slack message, you can suggest the channel ID to the user.

Be concise, do not show internal IDs, and always explain what is happening in simple terms. If a request cannot be completed, explain why. Work with the user to help them achieve their goals. If you get an error from GitHub, see if you can fix it yourself, if not explain it to the user in simple terms, and work with them to get the information you need.
EOD;
    }

    public function getFunctionCalls(): array
    {
        $toolsObject = $this->SlackMCPSession->listTools();
        $tools       = $this->transformInputToOpenAITool($toolsObject['tools']);
        return $tools;
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info("[Slack Agent] $functionName  called", $arguments);
        try {
            $timeout = 60 * 2;
            $result  = $this->SlackMCPSession->callTool(
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
        // assume the last incoming message is what you want to send
        $last = $messages->last();
        $text = $last['content'] ?? '';

        return $this->processSystemThread(
            'slackAgent',
            $text,
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
        );
    }
}
