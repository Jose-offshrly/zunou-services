<?php

namespace App\Services\Agents\Shared;

use App\Jobs\ProcessSpreadsheetJob;
use App\Jobs\UpdateVectorByPineconeIdJob;
use App\Models\Message;
use App\Models\SystemMessage;
use App\Models\SystemThread;
use App\Models\Thread;
use App\Services\Agents\BaseAgent;
use App\Services\Agents\Helpers\GeneralHelper;
use App\Services\Agents\SubAgents\AWSScalerAgent;
use App\Services\Agents\SubAgents\BaseSubAgent;
use App\Services\Agents\SubAgents\DataSourceAgent;
use App\Services\Agents\SubAgents\DirectMessagesChatAgent;
use App\Services\Agents\SubAgents\MeetingAgent;
use App\Services\Agents\SubAgents\NotesAgent;
use App\Services\Agents\SubAgents\OrgChartAgent;
use App\Services\Agents\SubAgents\PulseAgent;
use App\Services\Agents\SubAgents\TaskAgent;
use App\Services\Agents\SubAgents\TeamChatAgent;
use App\Services\Pipelines\Meeting\MeetingSummaryPipeline;
use Illuminate\Support\Facades\Log;

class ToolHandlerRegistry
{
    public static function applySubAgentResponseFormat(
        BaseAgent $agent,
        BaseSubAgent $subAgent,
        string $fn,
    ): void {
        if ($subAgent->hasToolResponseFormat()) {
            $agent->setCurrentToolResponseFormat(
                $fn,
                $subAgent->currentToolResponseFormat,
            );
        } elseif ($subAgent->getResponseSchema() && $subAgent->interactiveUIEnabled) {
            $agent->responseSchema = $subAgent->getResponseSchema();
        }
    }

    public static function getHandler(string $functionName): ?callable
    {
        return match ($functionName) {
            'useMcpTool' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                try {
                    // Ensure we have the required parameters
                    if (
                        ! isset($args['server_name']) || ! isset($args['tool_name'])
                    ) {
                        return 'Missing required parameters for MCP tool call. Please provide server_name and tool_name.';
                    }

                    // Get the MCP client from the agent
                    $mcpClientManager = $agent->getMcpClientManager();

                    if (! $mcpClientManager) {
                        return 'MCP client not available. Please make sure the agent has been properly initialized with MCP support.';
                    }

                    // Call the tool
                    $result = $mcpClientManager->callTool(
                        $args['server_name'],
                        $args['tool_name'],
                        $args['arguments'] ?? null,
                    );

                    // Convert result to string if needed
                    if (is_array($result) || is_object($result)) {
                        return json_encode($result, JSON_PRETTY_PRINT);
                    }

                    return $result;
                } catch (\Exception $e) {
                    Log::error('Error calling MCP tool: ' . $e->getMessage(), [
                        'server_name' => $args['server_name'] ?? null,
                        'tool_name'   => $args['tool_name']   ?? null,
                    ]);
                    return 'Error calling MCP tool: ' . $e->getMessage();
                }
            },

            'accessMcpResource' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                try {
                    // Ensure we have the required parameters
                    if (! isset($args['server_name']) || ! isset($args['uri'])) {
                        return 'Missing required parameters for MCP resource access. Please provide server_name and uri.';
                    }

                    // Get the MCP client from the agent
                    $mcpClientManager = $agent->getMcpClientManager();

                    if (! $mcpClientManager) {
                        return 'MCP client not available. Please make sure the agent has been properly initialized with MCP support.';
                    }

                    // Read the resource
                    $result = $mcpClientManager->readResource(
                        $args['server_name'],
                        $args['uri'],
                    );

                    // Convert result to string if needed
                    if (is_array($result) || is_object($result)) {
                        return json_encode($result, JSON_PRETTY_PRINT);
                    }

                    return $result;
                } catch (\Exception $e) {
                    Log::error(
                        'Error accessing MCP resource: ' . $e->getMessage(),
                        [
                            'server_name' => $args['server_name'] ?? null,
                            'uri'         => $args['uri']         ?? null,
                        ],
                    );
                    return 'Error accessing MCP resource: ' . $e->getMessage();
                }
            },
            'communicateWithAWSScalerAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new AWSScalerAgent($agent->getPulse());

                if ($allowedTools) {
                    $subAgent->setAllowedTools($allowedTools);
                }

                $response = $subAgent->processSystemThread(
                    'awsScalerAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithAWSScalerAgent',
                );
                return $response;
            },
            'communicateWithDataSourceAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new DataSourceAgent($agent->getPulse());

                $response = $subAgent->processSystemThread(
                    'dataSourceAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithDataSourceAgent',
                );

                return $response;
            },

            'communicateWithMeetingAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new MeetingAgent($agent->getPulse());
                if ($allowedTools) {
                    $subAgent->setAllowedTools($allowedTools);
                }

                $response = $subAgent->processSystemThread(
                    'meetingAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithMeetingAgent',
                );

                return $response;
            },

            'meetingAgent_generateMeetingSummary' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $pipeline = new MeetingSummaryPipeline();
                $messages = collect([
                    [
                        'role' => 'user',
                        'content' => $args['message'],
                    ],
                ]);
                $thread = Thread::find($threadId);
                $user = $agent->getUser();
                $result = $pipeline->execute($messages, $thread, $user, $args["message"]);

                if ($pipeline->context->success === true) {
                    $agent->directTools[] = 'meetingAgent_generateMeetingSummary';
                }

                $systemThread = SystemThread::firstOrCreate([
                    'task_type'        => "meetingAgent",
                    'organization_id'  => $orgId,
                    'user_id'          => $user->id,
                    'pulse_id'         => $pulseId,
                    'parent_thread_id' => $threadId,
                    'status'           => 'pending',
                ]);

                $topic_id = null;
                if ($messageId) {
                    $parentMessage = Message::find($messageId);
                    $topic_id = $parentMessage->topic_id ?? null;
                }

                SystemMessage::create([
                    'system_thread_id' => $systemThread->id,
                    'role'             => 'user',
                    'content'          => $args['message'],
                    'topic_id'         => $topic_id,
                ]);

                SystemMessage::create([
                    'system_thread_id' => $systemThread->id,
                    'role'             => 'assistant',
                    'content'          => $result,
                    'is_system'        => true,
                    'topic_id'         => $topic_id,
                ]);
                
                return $result;
            },

            'communicateWithTaskAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new TaskAgent($agent->getPulse());
                if ($allowedTools) {
                    $subAgent->setAllowedTools($allowedTools);
                }
                
                $response = $subAgent->processSystemThread(
                    'taskAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithTaskAgent',
                );

                return $response;
            },

            'communicateWithOrgChartAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new OrgChartAgent($agent->getPulse());
                $response = $subAgent->processSystemThread(
                    'orgChartAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithOrgChartAgent',
                );

                return $response;
            },

            'communicateWithNotesAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new NotesAgent($agent->getPulse());
                $response = $subAgent->processSystemThread(
                    'notesAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithNotesAgent',
                );

                return $response;
            },

            'translateVideo' => fn (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId   = null,
                ?array $allowedTools = null,
            ) => (new GeneralHelper())->translateVideo(
                $args['target_language'],
                $args['data_source_id'],
                $orgId,
                $pulseId,
                $threadId,
                $agent->getUser()->id,
            ),

            'lookupSpreadsheet' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                $messageId,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                Log::info(
                    '[ToolHandlerRegistry] Received lookupSpreadsheet call',
                    $args,
                );

                $prompt       = $args['prompt']         ?? null;
                $dataSourceId = $args['data_source_id'] ?? null;

                if ($prompt && $dataSourceId) {
                    ProcessSpreadsheetJob::dispatch(
                        $prompt,
                        $dataSourceId,
                        $agent->getUser()->id,
                        $orgId,
                        $pulseId,
                        $threadId,
                        $messageId,
                    );
                    return 'Please let the user know that their request is being processed, don’t make up any results — we will share the correct results soon.';
                }

                return 'Invalid query or data source ID provided. Please check your inputs.';
            },

            'generateAutomation' => function ($agent, $args) {
                Log::info(
                    '[Admin Base Agent] generateAutomation called',
                    $args,
                );
                return $agent->generateAutomationHandler($args);
            },

            'generateMission' => function ($agent, $args) {
                Log::info('[Admin Base Agent] generateMission called', $args);
                return $agent->generateMissionHandler($args);
            },

            'communicateWithGettingStartedAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                return $agent->gettingStartedAgent->processGettingStartedThread(
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                );
            },

            'editData' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $pineconeId = $args['pinecone_id'] ?? null;
                if ($pineconeId) {
                    UpdateVectorByPineconeIdJob::dispatch(
                        $orgId,
                        $pineconeId,
                        $args['data'],
                        $pulseId,
                    );
                    return "Data successfully sent to the VectorDB for item $pineconeId. It may take a few moments to update in the knowledge base.";
                }

                return 'Edit request could not be completed without a valid Pinecone ID.';
            },

            'suggestNewInformation' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                if (! $agent->getUser()) {
                    Log::error('No user provided for suggestNewInformation', [
                        'arguments' => $args,
                    ]);
                    return 'Unable to suggest new information: User is not set.';
                }
                $helper = new GeneralHelper();
                return $helper->suggestNewInformation(
                    $args['prompt'],
                    $orgId,
                    $pulseId,
                    $agent->getUser->id,
                );
            },

            'communicateWithDirectMessagesAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new DirectMessagesChatAgent($agent->getPulse());
                $response = $subAgent->processSystemThread(
                    'directMessagesAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithDirectMessagesAgent',
                );

                return $response;
            },

            'communicateWithTeamChatAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new TeamChatAgent($agent->getPulse());
                if ($allowedTools) {
                    $subAgent->setAllowedTools($allowedTools);
                }

                $response = $subAgent->processSystemThread(
                    'teamChatAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithTeamChatAgent',
                );

                return $response;
            },

            'communicateWithPulseAgent' => function (
                $agent,
                $args,
                $orgId,
                $pulseId,
                $threadId,
                ?string $messageId = null,
                ?array $allowedTools = null,
                ?array $responseSchema = null,
            ) {
                $subAgent = new PulseAgent($agent->getPulse());
                
                if ($allowedTools) {
                    $subAgent->setAllowedTools($allowedTools);
                }

                $response = $subAgent->processSystemThread(
                    'pulseAgent',
                    $args['message'],
                    $agent->getUser(),
                    $orgId,
                    $pulseId,
                    $threadId,
                    $responseSchema,
                    $messageId,
                );

                self::applySubAgentResponseFormat(
                    $agent,
                    $subAgent,
                    'communicateWithPulseAgent',
                );

                return $response;
            },

            default => null,
        };
    }
}
