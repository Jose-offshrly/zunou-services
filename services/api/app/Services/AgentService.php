<?php

namespace App\Services;

use App\Services\Agents\BaseAgent;
use App\Services\Agents\GenericAdminAgent;
use App\Services\Agents\GenericAgent;
use App\Services\Agents\HRAdminAgent;
use App\Services\Agents\HRAgent;
use App\Services\Agents\LiveInsightsAgent;
use App\Services\Agents\MCPAdminAgent;
use App\Services\Agents\OpsAdminAgent;
use Illuminate\Support\Facades\Log;

class AgentService
{
    protected $agents;

    public function __construct()
    {
        $this->agents = [
            'user' => [
                'hr' => HRAgent::class,
                //'sales'   => SalesAgent::class, // Just an example
                'generic' => GenericAgent::class,
            ],
            'admin' => [
                'hr'  => HRAdminAgent::class,
                'mcp' => MCPAdminAgent::class,
                //'sales'   => SalesAdminAgent::class, // Just an example
                'generic' => GenericAdminAgent::class,
                'ops'     => OpsAdminAgent::class,
            ],
            'live_insights' => LiveInsightsAgent::class,
        ];
    }

    public function getAgent(
        $pulse,
        string $threadType,
        ?array $questionSpecificContext = null,
    ): BaseAgent {
        $pulseType = $pulse->type; // eg: hr / sales / generic
        // Determine the correct agent class
        $agentClass = $this->agents[$threadType][$pulseType] ?? null;
        if (!$agentClass) {
            // check system threads
            $agentClass = $this->agents[$threadType] ?? null;
        }

        if (!$agentClass) {
            // fallback to generic
            $agentClass = $this->agents['user']['generic'];
        }

        if ($questionSpecificContext && isset($questionSpecificContext["topic_id"])) {
            $agentClass = LiveInsightsAgent::class;
        }

        // Instantiate the agent
        $agent = new $agentClass($pulse, $questionSpecificContext);

        Log::info('Use agent', [
            'pulseType'               => $pulseType,
            'threadType'              => $threadType,
            'agent'                   => get_class($agent),
            'questionSpecificContext' => $questionSpecificContext,
        ]);

        return $agent;
    }
}
