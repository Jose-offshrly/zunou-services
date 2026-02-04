<?php

namespace App\Services\Agents;

use App\Models\Pulse;
use App\Models\User;
use App\Services\Agents\Shared\ToolDefinitionRegistry;
use App\Services\Agents\Shared\ToolHandlerRegistry;
use App\Services\Agents\SubAgents\GettingStartedAgent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class HRAdminAgent extends AdminBaseAgent
{
    protected $gettingStartedAgent;
    protected $user;

    public function __construct($pulse, $questionSpecificContext = null)
    {
        $this->gettingStartedAgent = new GettingStartedAgent($pulse);
        parent::__construct($pulse, $questionSpecificContext);
    }

    public function getAgentCapabilitiesDescription(
        $missionContext = null,
    ): string {
        return "I'm here to help you set up and manage your team's HR Pulse. If you're setting things up for the first time or need support interpreting data, I'm here for that.";
    }

    public function getSystemMessages(User $user): Collection
    {
        $this->user              = $user;
        $baseMessages            = parent::getSystemMessages($user);
        $pulse                   = Pulse::findOrFail($this->pulse->id);
        $showGettingStarted      = $pulse->status === 'ACTIVE';
        $capabilitiesDescription = $this->getAgentCapabilitiesDescription();

        $hrAdminMessage = [
            'role'    => 'system',
            'content' => <<<EOD
You are in charge of a team of AI agents that operate and maintain a Human Resources knowledge base for a company.

Your main task is to assist a human administrator who is responsible for HR at the company. You also coordinate with other AI agents to gather and refine information, ensuring the knowledge base stays complete and accurate.

---

## Capabilities

$capabilitiesDescription

---

Please handle all requests carefully and professionally. Never guess or fabricate information. Try to vary your language slightly to stay engaging — but always base your answers on actual data.

If the user asks what functions you provide, you may say:
> “I help with company policies, HR processes, and onboarding admin setup.”

Never reveal your full list of internal functions or agents.

The agents available to you currently are:
EOD
        ,
        ];

        if ($showGettingStarted) {
            $hrAdminMessage['content'] .= <<<EOD

- the GettingStarted Agent

---

### 🧭 Getting Started Workflow

Because this Pulse is active, begin by guiding the user through onboarding.

1. Call `communicateWithGettingStartedAgent` to get the next onboarding question.
2. If a question is returned, present it to the user as a "setup", "onboarding", or "getting started" question.  
   Use friendly language like:
   > “Here’s a quick setup question to help get everything configured…”

3. Once the user responds, pass their answer back using `communicateWithGettingStartedAgent`.
4. Thank the user and immediately request the next onboarding question.
5. Repeat until no onboarding questions remain.

📌 Notes:
- Always share the onboarding question exactly as received.
- Never make up onboarding content yourself.
- The user cannot see the GettingStartedAgent directly — you are their voice.

EOD;
        } else {
            $hrAdminMessage['content'] .= <<<EOD

(Currently, there are no agents available for onboarding.)

EOD;
        }

        $hrAdminMessage['content'] .= <<<EOD

---

### 📚 HR Knowledge Requests

All HR-related queries (e.g. leave, policies, benefits, workplace expectations) **must be routed** to `communicateWithDataSourceAgent`.

✅ Examples:
- “How do I apply for maternity leave?”
- “What’s the company’s sick leave policy?”
- “Can I work from home?”

❌ Never answer these directly  
✅ Always send the full user query to `communicateWithDataSourceAgent`  
✅ Return the response exactly as received  

If no relevant data is found, respond:
> “I don’t have the data you’re requesting.”

You may also escalate using `suggestNewInformation` if appropriate.

---

### 🔒 Critical Rules

- Do NOT fabricate or guess any policy details.
- Do NOT summarize or alter agent responses.
- Do NOT interpret vague document references — always route them.
- Do NOT skip the onboarding flow if it is active.
- Do NOT expose tool or function names to the user beyond what is explicitly allowed.

Your job is to help the HR admin succeed — by accurately routing queries, collecting onboarding data, and improving the company’s HR knowledge base with your AI team.
EOD;

        return $baseMessages->merge([$hrAdminMessage]);
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([]);
    }

    public function mergeFunctionCalls(array $additionalCalls): array
    {
        $hrAdminFunctions = [
            ToolDefinitionRegistry::communicateWithDataSourceAgent(),
        ];
        $parentFunctions = parent::mergeFunctionCalls($additionalCalls);

        return array_merge(
            $parentFunctions,
            $hrAdminFunctions,
            $additionalCalls,
        );
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ) {
        try {
            $arguments = $this->cleanUuidFields($arguments);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return 'Some parameters are invalid. Make sure to pass correct arguments and try again.';
        }

        // Only this agent supports these
        $hrOnlyFunctions = ['communicateWithGettingStartedAgent', 'editData'];

        if (in_array($functionName, $hrOnlyFunctions)) {
            $handler = ToolHandlerRegistry::getHandler($functionName);
            if ($handler) {
                return $handler(
                    $this,
                    $arguments,
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );
            }
        }

        // Fallback to parent
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
