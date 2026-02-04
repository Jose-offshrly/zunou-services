<?php

namespace App\Services\MCP;

use App\Helpers\CountryHelper;
use App\Models\AiAgent;
use App\Models\User;
use App\Services\MCP\Client\ClientSession;
use App\Services\MCP\Types\TokenData;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Support\Facades\Log;
use stdClass;

abstract class MCPIntegration
{
    public MCPClientManager $mcpClientManager;
    public ClientSession $session;
    public AiAgent $agent;
    public User $user;

    public const NO_HANDLER_FOUND = 'NO_HANDLER_FOUND';

    public function __construct(AiAgent $agent, User $user)
    {
        $this->agent            = $agent;
        $this->user             = $user;
        $this->mcpClientManager = new MCPClientManager();
        
        $this->session = $this->initializeSession();
    }

    protected function initializeSession(): ClientSession
    {
        // get mcp type [github, jira, slack, math etc.]
        $agentType = strtolower($this->agent->agent_type);

        // get server config [type, url, description, enabled]
        $serverConfig = config("mcp.servers.{$agentType}");
        $transportType = $serverConfig['type'] ?? null;


        switch ($transportType) {
            case 'streamable-http':
                return $this->getStreamableHttpSession();
            case 'sse':
                return $this->getSSESession();
            case 'stdio':
                return $this->getStdioSession();
            default:
                throw new \Exception('Invalid MCP server transport type');
        }
    }

    protected function getSSESession(): ClientSession
    {
        $encryptedTokenData = $this->agent->credentials;
        $tokenData = TokenData::fromArray($encryptedTokenData);

        $refreshTokenFn = function () use ($tokenData) {
            Log::info("Refreshing token received", [$tokenData]);

            $tokenManager = new TokenManager($tokenData);
            $newTokenData = $tokenManager->refreshToken();
        
            $this->agent->credentials = $newTokenData->toArray();
            $this->agent->save();

            return $newTokenData;
        };

        $serverName = strtolower($this->agent->agent_type);
        $session = $this->mcpClientManager->createSSESession(
            config("mcp.servers.{$serverName}.url"),
            [
                'Authorization' => 'Bearer ' . $tokenData->access_token,
            ],
            $serverName,
            $refreshTokenFn
        );

        return $session;
    }
   
    protected function getStreamableHttpSession(): ClientSession
    {
        $credentials = $this->agent->credentials;
        $apiKey      = $credentials['key'];

        $options = [
            'connection_timeout' => 10.0,
            'read_timeout' => 30.0,
            'verify_ssl' => true,
        ];

        // agent_type -> make sure the config name and agent_type field on ai_agents table matches (case insensitive)
        $agentType = strtolower($this->agent->agent_type);
        $url = config("mcp.servers.{$agentType}.url");

        $headers = [
            'Authorization' => 'Bearer ' . $apiKey,
        ];
        
        $session = $this->mcpClientManager->createStreamableHttpSession(
            $url,
            $headers,
            $options,
            strtolower($this->agent->agent_type),
        );
        $session->initialize();
        return $session;
    }
   
    protected function getStdioSession(): ClientSession
    {
        throw new \Exception('Not implemented');
    }

    public function getTools(): array
    {
        $mcpTools = [];
        try {
            $toolsObject = $this->session->listTools();
            $mcpTools = $this->transformInputToOpenAITool($toolsObject['tools']);
        } catch (\Throwable $th) {
            Log::error("Error getting tools for " . $this->agent->name, ["error" => $th->getMessage()]);
        }
        $customTools = $this->getCustomTools();
        return array_merge($mcpTools, $customTools);
    }

    public function getCustomTools(): array
    {
        return [];
    }

    public function transformInputToOpenAITool($tools)
    {
        return array_map(function ($tool) {
            $parameters = $tool['inputSchema'];
            
            // Handle root level properties
            if ($parameters['type'] === 'object' && isset($parameters['properties'])) {
                if (empty($parameters['properties'])) {
                    $parameters['properties'] = new stdClass();
                } else {
                    $parameters['properties'] = $this->transformProperties($parameters['properties']);
                }
            }

            return [
                'type'     => 'function',
                'function' => [
                    'name'        => $tool['name'],
                    'description' => $tool['description'],
                    'parameters'  => $parameters,
                ],
            ];
        }, $tools);
    }

    private function transformProperties($properties) {
        if (empty($properties)) {
            return new stdClass();
        }
        
        $transformed = [];
        foreach ($properties as $key => $property) {
            if (isset($property['type']) && $property['type'] === 'object') {
                // Handle nested properties
                if (isset($property['properties'])) {
                    if (empty($property['properties'])) {
                        $property['properties'] = new stdClass();
                    } else {
                        $property['properties'] = $this->transformProperties($property['properties']);
                    }
                }
                
                // Handle additionalProperties
                if (isset($property['additionalProperties']) && 
                    is_array($property['additionalProperties']) && 
                    empty($property['additionalProperties'])) {
                    $property['additionalProperties'] = new stdClass();
                }
            }
            $transformed[$key] = $property;
        }
        
        return $transformed;
    }

    public function getSystemPrompt(): string
    {
        throw new \Exception('Not implemented');
    }

    public static function routeToolDefinition(): array
    {
        throw new \Exception('Not implemented');
    }

    /**
     * This is the response schema for general purposes
     * This is responsible for displaying ui in the assistant response
     */
    public function getResponseSchema(): ?array
    {
        return null;
    }

    protected function buildSystemPrompt(string $customPrompt): string
    {
        $now           = Carbon::now()->setTimezone($this->user->timezone);
        $formattedDate = $now->format('l F jS Y');
        $formattedTime = $now->format('H:i A');
        $userName      = $this->user ? $this->user->name : 'Guest';

        $country  = new DateTimeZone($this->user->timezone);
        $location = $country->getLocation();

        $country_code = empty($location['country_code'])
            ? 'JP'
            : $location['country_code'];
        
        $countryName = CountryHelper::getCountryName($country_code);

        return <<<PROMPT
You are talking to $userName. It is $formattedDate. We are in $countryName. It is $formattedTime. Always refer to this user's current date and time.

{$customPrompt}

## Communicate With User Using UI Elements

You can communicate with the user using UI elements.

- references - this is used to show the user the external_link to the issue. Always use this whenever issue is created, updated or listed. This makes the navigation and viewing of the issue easier for the user. the type should be external_url
- Options - whenever there are multiple options available, use this to show the user the options. Don't assume what the user wantsor make up options, always use the options provided by the tool.
- Confirmation - this is used to confirm the user's action. This can be also used an option if found results are single.

Note: DO not overdo the use of ui elements especially options, use these only when necessary, strictly when presenting multiple options with actions required for user. If only listing items do not use options, Just present it normally in text response.
However for confirmation and references, always use these when necessary.
When editing or deleting ask confirmation first, do that always present what to delete or what edit looks like before proceeeding.

No need to confirm again if message comes from this ui elements. meaning if the message is clicked from the references, options or confirmation, do not ask for confirmation again, Thats already confirmed.
PROMPT;
    }

    public function handleCustomFunctionCall(string $functionName, array $arguments)
    {
        switch ($functionName) {
            default:
                return "NO_HANDLER_FOUND";
        }
    }
}
