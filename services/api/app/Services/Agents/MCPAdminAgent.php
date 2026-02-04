<?php

namespace App\Services\Agents;

use App\Models\User;
use Illuminate\Support\Collection;

class MCPAdminAgent extends AdminBaseAgent
{
    public function __construct($pulse, $questionSpecificContext = null)
    {
        parent::__construct($pulse, $questionSpecificContext);
    }

    public function getSystemMessages(User $user): Collection
    {
        $baseMessages = parent::getSystemMessages($user);
        return $baseMessages->merge([
            [
                'role'    => 'system',
                'content' => <<<EOD

## Pulse Specific Tools
These are the additional tools similar to what is defined above. Same rules applies.

### 1. **communicateWithJiraAgent**
  - **Purpose**: Manage anything explicitly related to Jira tickets, issues, projects, or teams.
  - **Usage**:  
  - Use only if the current message **explicitly mentions "Jira"** or requests a Jira-specific action.
  - **Instructions**:  
  - Route the entire user message to this agent without modification.
  - Do not summarize or process the request yourself.
  - Let this agent interpret and handle all Jira-related context and operations.
  - **Note**:  
- This is **not** the default for tasks. Only use for Jira by explicit request.

### 2. **communicateWithGitHubAgent**
  - **Purpose**: Manage anything explicitly related to GitHub repositories, issues, pull requests, or teams.
  - **Usage**:  
  - Use only if the current message **explicitly mentions "GitHub"** or requests a GitHub-specific action.
  - **Instructions**:  
  - Route the entire user message to this agent without modification.
  - Do not summarize or process the request yourself.
  - Let this agent interpret and handle all GitHub-related context and operations.
  - **Note**:  
- This is **not** the default for tasks. Only use for GitHub by explicit request.

### 3. **communicateWithSlackAgent**
  - **Purpose**: Manage anything explicitly related to Slack channels, messages, or teams.
  - **Usage**:  
  - Use only if the current message **explicitly mentions "Slack"** or requests a Slack-specific action.
  - **Instructions**:  
  - Route the entire user message to this agent without modification.
  - Do not summarize or process the request yourself.
  - Let this agent interpret and handle all Slack-related context and operations.
  - **Note**:  
- This is **not** the default for tasks. Only use for Slack by explicit request.

---

### 🔍 Routing Summary

| Type of Content                                                                     | Route To                              |
|-------------------------------------------------------------------------------------|---------------------------------------|
| Jira tasks, tickets, issues **(if "Jira" in message)**                              | `communicateWithJiraAgent`            |
| GitHub repositories, issues, or pull requests **(if "GitHub" in message)**          | `communicateWithGitHubAgent`          |
| Slack channels, messages, or teams **(if "Slack" in message)**                      | `communicateWithSlackAgent`           |


#### **Jira Agent vs. Task Agent Routing**

| User Query                                 | Route To    | Rule                               |
|--------------------------------------------|-------------|------------------------------------|
| Create a Jira issue for bug XYZ            | Jira Agent  | "Jira" is in the current message   |
| Create a ticket for bug XYZ in Jira        | Jira Agent  | "Jira" is in the current message   |
| Create a Jira task for password reset      | Jira Agent  | "Jira" is in the current message   |
| Create a task for bug XYZ                  | Task Agent  | "Jira" NOT in the current message  |
| What are my open tasks today?              | Task Agent  | "Jira" NOT in the current message  |

### **GitHub Agent vs. Task Agent Routing**

| User Query                                 | Route To    | Rule                               |
|--------------------------------------------|-------------|------------------------------------|
| Create a GitHub issue for bug XYZ          | GitHub Agent | "GitHub" is in the current message |
| Create a GitHub pull request for bug XYZ   | GitHub Agent | "GitHub" is in the current message |
| What are my open pull requests today?      | GitHub Agent | "GitHub" NOT in the current message |
| Create a issue for bug XYZ                 | GitHub Agent | "GitHub" NOT in the current message |

### **Slack Agent vs. Task Agent Routing**

| User Query                                 | Route To    | Rule                               |
|--------------------------------------------|-------------|------------------------------------|
| Create a Slack message for bug XYZ         | Slack Agent | "Slack" is in the current message |
| Create a Slack message for bug XYZ         | Slack Agent | "Slack" is in the current message |
| What are my open messages today?           | Slack Agent | "Slack" NOT in the current message |
| Create a issue for bug XYZ                 | Slack Agent | "Slack" NOT in the current message |

**Routing Rules:**
- If the word **"GitHub" appears in the current user message**, route to **GitHub Agent**.
- If the word **"Jira" appears in the current user message**, route to **Jira Agent**.
- If the word **"Slack" appears in the current user message**, route to **Slack Agent**.

- If "Jira" is **not** in the current message, always route to **Task Agent**.
- If "GitHub" is **not** in the current message, always route to **Task Agent**.
- If "Slack" is **not** in the current message, always route to **Task Agent**.

- **Never use previous messages or conversation context** to determine the route—**always decide based only on the current message**.
- **If unclear or ambiguous, ask the user for clarification rather than guessing.**

EOD
            ,
            ],
        ]);
    }

    public function getFunctionCalls(): array
    {
        // Only include standard functions defined in BaseAgent
        return $this->mergeFunctionCalls([]);
    }

    public function mergeFunctionCalls(array $additionalCalls): array
    {
        $genericFunctions = [];
        $parentFunctions = parent::mergeFunctionCalls($additionalCalls);

        return array_merge($parentFunctions, $genericFunctions);
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ) {
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
