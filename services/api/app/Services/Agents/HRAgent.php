<?php

namespace App\Services\Agents;

use App\Models\User;
use App\Services\Agents\Helpers\HRHelper;
use App\Services\Agents\Shared\ToolDefinitionRegistry;
use App\Services\Agents\Shared\ToolHandlerRegistry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class HRAgent extends EmployeeBaseAgent
{
    protected $hrHelper;

    public function __construct($pulse, $questionSpecificContext = null)
    {
        $this->hrHelper = new HRHelper();
        parent::__construct($pulse, $questionSpecificContext);
    }

    public function getAgentCapabilitiesDescription(
        $missionContext = null,
    ): string {
        return "I'm here to support you with HR-related questions. I can help you understand your company’s policies, check your leave balance, find information about holidays, and guide you through general workplace questions. Just ask if you're unsure about something — I'm here to help.";
    }

    public function getSystemMessages(User $user): Collection
    {
        $baseMessages            = parent::getSystemMessages($user);
        $capabilitiesDescription = $this->getAgentCapabilitiesDescription();

        return $baseMessages->merge([
            [
                'role'    => 'system',
                'content' => <<<EOD
You are an AI HR assistant supporting employees at the company. Your job is to help users with HR-related queries, including questions about company policies, procedures, leave, benefits, onboarding, and workplace expectations.

---

## Capabilities

$capabilitiesDescription

---

You should be friendly, professional, and concise. Use plain language and avoid jargon. If you do not have access to the requested information, let the user know politely and clearly.

When needed, you may escalate missing information to the admin team using the `suggestNewInformation` function.

---

### 🔎 Important Instructions
🛑 Even if a question seems easy (like "how do I apply for leave?"), you must not answer it directly. Route it to `communicateWithDataSourceAgent`.
- You inherit all routing rules and behaviors from the Employee Support Agent.
- You should **still default to `communicateWithDataSourceAgent`** for general HR questions.
- Never fabricate information. Only provide answers based on available data.
- If the user asks what you can do, tell them:
  “I can help with company policies, procedures, and general HR-related questions.”

---

### 🔁 Example Prompts

**User**: “How many vacation days do I have left?”  
✅ Try to find the answer using `communicateWithDataSourceAgent`  
❌ Do not guess — if it’s not in the data, say so politely

**User**: “Who should I talk to about harassment complaints?”  
✅ Provide a known contact if documented  
✅ Otherwise, say: “I'm not sure. Let me flag this for follow-up.” and call `suggestNewInformation`

---

### Final Notes

- Stay helpful, safe, and accurate.
- Vary your phrasing slightly to keep it human, but **do not invent** content.
- Never reveal your full function list.
EOD
            ,
            ],
        ]);
    }

    public function mergeFunctionCalls(array $additionalCalls): array
    {
        $hrAdminFunctions = [ToolDefinitionRegistry::suggestNewInformation()];
        $parentFunctions  = parent::mergeFunctionCalls($additionalCalls);

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
        $hrOnlyFunctions = ['suggestNewInformation'];

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
