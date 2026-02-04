<?php

namespace App\Models;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\Actions\DataSource\ProcessMeetingDataSourceAction;
use App\Actions\DataSource\UploadDataSourceFileToS3Action;
use App\Actions\FireFlies\FetchFireFliesTranscriptSentencesAction;
use App\Actions\FireFlies\GenerateSummaryAction;
use App\Actions\Transcript\CreateMeetingTranscriptAction;
use App\Enums\AutomationType;
use App\Enums\NotificationType;
use App\Helpers\ToolParserHelper;
use App\Services\Agents\Handlers\DataSourceHandler;
use App\Services\Agents\Helpers\MarkdownParser;
use App\Services\Agents\Helpers\MeetingHelper;
use App\Services\FirefliesMeetingProcessorService;
use Exception;
use GuzzleHttp\Client;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Automation extends Model
{
    use LogsActivity;

    protected $fillable = [
        'strategy_id',
        'on_queue',
        'type',
        'next_run_at',
        'user_id',
    ];

    public $incrementing = false;
    protected $keyType   = 'string';

    protected $casts = [
        'type' => AutomationType::class,
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['on_queue', 'type', 'next_run_at'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function strategy(): BelongsTo
    {
        return $this->belongsTo(Strategy::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFunctionCalls(): array
    {
        return [
            [
                'type'        => 'function',
                'name'        => 'createTasksFromMeeting',
                'description' => 'This tool creates tasks from a meeting data source. It extracts action items from the meeting summary and creates corresponding tasks. Meeting summary tool must be called before this tool.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'data_source_id' => [
                            'description' => 'The unique identifier of the meeting data source.',
                            'type'        => 'string',
                        ],
                        'acknowledgment' => [
                            'type'        => 'string',
                            'description' => 'Short confirmation message to inform user that tasks have been created.',
                        ],
                    ],
                    'required' => ['data_source_id', 'acknowledgment'],
                ],
            ],
            [
                'type'        => 'function',
                'name'        => 'generateMeetingSummary',
                'description' => 'This tool is responsible for generating summary for any kind of meeting. Strictly check if the matched data source queried has "Data Source Origin" of "meeting". Always use this tool when user ask for summary for the specific meeting. This tool accept and works only on single meeting summary generation.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'data_source_id' => [
                            'description' => 'The unique identifier of the retrieved meeting from the knowledge base. Extract this from the lookupInformation tool under the "data_source_id" or "Data Source Id" field. Do not generate or assume this value.',
                            'type'        => 'string',
                        ],
                        'meeting_name' => [
                            'type'        => 'string',
                            'description' => 'The name of the meeting.',
                        ],
                        'user_lookup_prompt' => [
                            'type'        => 'string',
                            'description' => 'the prompt passed in lookupinformation tool',
                        ],
                    ],
                    'required' => [
                        'data_source_id',
                        'meeting_name',
                        'user_lookup_prompt',
                    ],
                ],
            ],
            [
                'type'        => 'function',
                'name'        => 'getMeetingList',
                'description' => 'Important Use this tool only if the user explicitly asks for meetings list exclusively, the meeting can be filtered by date or keywords. Non-specific dates such as "future" and "upcoming" are supported. If the user doesn\'t explicitly ask for the list, the meetings here will be added as a data source. Otherwise use the \'lookupInformation\' tool to retrieve meetings in data source. This tool retrieves meetings in the fireflies API. It accepts query parameters to dynamically get the meetings on-demand and can filter meetings by keywords. This tool returns meeting list',
                'parameters'  => [
                    'properties' => [
                        'acknowledgment' => [
                            'type'        => 'string',
                            'description' => 'Short acknowledgement response to the user. This will serve as a reply to the user saying here\'s the list of meetings you requested, something like that. Always end your response with. Here\'s the list:. Its important because I will display the list below that',
                        ],
                        'query' => [
                            'properties' => [
                                'keywords' => [
                                    'default'     => null,
                                    'description' => 'Search terms to filter meetings by title or content. Multiple keywords can be provided as comma-separated values.',
                                    'format'      => 'string',
                                    'type'        => 'string',
                                ],
                                'limit' => [
                                    'default'     => 4,
                                    'description' => 'Number of transcripts to return. Maximum 10 in one query',
                                    'type'        => 'integer',
                                ],
                                'skip' => [
                                    'default'     => 0,
                                    'description' => 'Number of transcripts to skip. defaults to 0',
                                    'type'        => 'integer',
                                ],
                            ],
                            'type' => 'object',
                        ],
                    ],
                    'required' => ['query', 'acknowledgment'],
                    'type'     => 'object',
                ],
            ],
            [
                'type'        => 'function',
                'name'        => 'createOrFindMeetingDataSources',
                'description' => 'This tool ensures that each meeting in the provided list has an associated data source. If a meeting already has one, its data source ID is added to the returned list; otherwise, a new data source is created, the meeting status is updated to "added", and the new data source is added to the returned list.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'meetings' => [
                            'type'  => 'array',
                            'items' => [
                                'type'       => 'object',
                                'properties' => [
                                    'id' => [
                                        'type'        => 'string',
                                        'description' => 'The unique identifier of the meeting.',
                                    ],
                                ],
                                'required' => ['id'],
                            ],
                        ],
                    ],
                    'required' => ['meetings'],
                ],
            ],
            [
                'type'        => 'function',
                'name'        => 'notifyNewlyCreatedMeetingSummary',
                'description' => 'Use this tool to notify pulse members or users about the summary meeting.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'summary_id' => [
                            'description' => 'The ID (uuid) of the newly generated summary of meeting.',
                            'type'        => 'string',
                        ],
                    ],
                    'required' => ['summary_id'],
                ],
            ],
            [
                'type'        => 'function',
                'name'        => 'editMeetingSummary',
                'description' => 'This tool is called when user request updates on existing summary. This tool is exclusively for editing an existing summary. Do NOT call this immediately after generating a summary. Only use this tool when a user explicitly requests an update to a previously generated summary, and ensure that the summary ID exists before calling.',
                'parameters'  => [
                    'type'       => 'object',
                    'required'   => ['summary_id', 'operations'],
                    'properties' => [
                        'summary_id' => [
                            'description' => 'The unique identifier of the summary to update.',
                            'type'        => 'string',
                        ],
                        'operations' => [
                            'description' => 'A list of operations to perform on the summary. Each item is object with key being the field and the value is the updated value of the field. Only pass the items thats needed to be updated.',
                            'type'        => 'array',
                            'items'       => [
                                'type'       => 'object',
                                'required'   => ['field', 'action'],
                                'properties' => [
                                    'field' => [
                                        'description' => 'The field of the summary to update.',
                                        'type'        => 'string',
                                        'enum'        => [
                                            'summary',
                                            'name',
                                            'date',
                                            'attendees',
                                            'potential_strategies',
                                        ],
                                    ],
                                    'updated_value' => [
                                        'description' => 'The updated value of the field. Always keep the formatting of the original',
                                        'type'        => 'string',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
    ): string {
        // Log before tool call
        Log::info('[Automation] Before tool call', [
            'function'      => $functionName,
            'parameters'    => $arguments,
            'automation_id' => $this->id,
            'strategy_id'   => $this->strategy?->id,
        ]);

        $result = '';
        try {
            switch ($functionName) {
                case 'generateMeetingSummary':
                    $result = $this->generateMeetingSummaryHandler($arguments);
                    break;

                case 'getMeetingList':
                    $result = $this->getMeetingListHandler($arguments);
                    break;

                case 'notifyNewlyCreatedMeetingSummary':
                    $result = $this->notifyNewlyCreatedMeetingSummaryHandler(
                        $arguments,
                    );
                    break;

                case 'editMeetingSummary':
                    $result = $this->editMeetingSummaryHandler($arguments);
                    break;

                case 'createOrFindMeetingDataSources':
                    $result = $this->createOrFindMeetingDataSourcesHandler(
                        $arguments,
                    );
                    break;

                case 'createTasksFromMeeting':
                    $result = $this->createTasksFromMeetingHandler($arguments);
                    break;

                default:
                    throw new Exception("Unknown function: $functionName");
            }

            // Log after tool call
            Log::info('[Automation] After tool call', [
                'function'      => $functionName,
                'result'        => $result,
                'automation_id' => $this->id,
                'strategy_id'   => $this->strategy?->id,
            ]);

            return $result;
        } catch (Exception $e) {
            // Log error if tool call fails
            Log::error('[Automation] Tool call failed', [
                'function'      => $functionName,
                'error'         => $e->getMessage(),
                'automation_id' => $this->id,
                'strategy_id'   => $this->strategy?->id,
                'line_number'   => $e->getLine(),
                'file'          => $e->getFile(),
                'trace'         => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    private function createOrFindMeetingDataSourcesHandler(
        array $arguments,
    ): string {
        $createdCount           = 0;
        $dataSourceWithMeetings = [];

        foreach ($arguments['meetings'] as $meetingData) {
            try {
                DB::beginTransaction();

                $meeting = Meeting::find($meetingData['id']);
                if (! $meeting) {
                    Log::info('[Automation] Meeting not found', [
                        'meeting_id' => $meetingData['id'],
                    ]);
                    DB::rollBack();
                    continue;
                }

                // If meeting already has a data source, add it to the list for later use and commit the transaction.
                if ($meeting->data_source_id) {
                    Log::info('[Automation] Meeting already has data source', [
                        'meeting_id' => $meeting->id,
                    ]);
                    $dataSourceWithMeetings[] = $meeting->data_source_id;
                    DB::commit();
                    continue;
                }

                // Retrieve pulse from the strategy
                $pulse = $this->strategy->pulse;
                if (! $pulse) {
                    Log::error('[Automation] Pulse not found for strategy', [
                        'strategy_id' => $this->strategy->id,
                    ]);
                    DB::rollBack();
                    continue;
                }

                // Retrieve the integration for Fireflies using the defined $pulse
                $integration = \App\Models\Integration::where(
                    'pulse_id',
                    $pulse->id,
                )
                    ->where('user_id', $this->user_id)
                    ->where('type', 'fireflies')
                    ->first();
                if (! $integration) {
                    Log::error('[AUTOMATION] No Fireflies integration found', [
                        'pulse_id' => $pulse->id,
                        'user_id'  => $this->user_id,
                    ]);
                    DB::rollBack();
                    continue;
                }

                // Create the data source for the meeting
                $dataSource = (new CreateMeetingDataSourceAction())->handle(
                    meeting: $meeting,
                    organizationId: $pulse->organization_id,
                    pulseId: $pulse->id,
                );

                if (! $dataSource || ! $dataSource->id) {
                    Log::error(
                        '[AUTOMATION] Failed to create data source for meeting',
                        [
                            'meeting_id' => $meeting->id,
                        ],
                    );
                    DB::rollBack();
                    continue;
                }

                $createdCount++;
                $dataSourceWithMeetings[] = $dataSource->id;

                // Process data source (this call could be deferred to after commit or dispatched as a separate job)
                $processAction = new ProcessMeetingDataSourceAction(
                    new FetchFireFliesTranscriptSentencesAction(),
                    new GenerateSummaryAction(),
                    new UploadDataSourceFileToS3Action(),
                    new FirefliesMeetingProcessorService(),
                    new CreateMeetingTranscriptAction(),
                );
                $processAction->handle(
                    integration: $integration, // ensure $integration is defined as in your code.
                    meeting: $meeting,
                    dataSource: $dataSource,
                    organizationId: $this->strategy->pulse->organization_id,
                    broadcast: false,
                );

                $meeting->status = 'added';
                $meeting->save();

                DB::commit();

                Log::info(
                    '[AUTOMATION] Process Meeting Data Source Action is completed',
                    [
                        'data_source_id' => $dataSource->id,
                        'meeting_id'     => $meeting->id,
                    ],
                );

                // Call processFileDataSource after transaction commit
                if ($dataSource->status !== 'FAILED') {
                    $this->processFileDataSource($dataSource->id);
                } else {
                    Log::error(
                        '[AUTOMATION] Skipping file processing due to failed data source',
                        [
                            'data_source_id' => $dataSource->id,
                        ],
                    );
                }
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('[AUTOMATION] Transaction failed', [
                    'error'      => $e->getMessage(),
                    'meeting_id' => $meetingData['id'] ?? null,
                ]);
                continue;
            }
        }

        return json_encode([
            'type'    => 'success',
            'message' => "Successfully created $createdCount data sources for meetings",
            'data'    => [
                'meetings' => $dataSourceWithMeetings,
            ],
        ]);
    }

    private function processFileDataSource(string $dataSourceId): void
    {
        Log::info('Processing file with data source ID ' . $dataSourceId);

        try {
            // Get the data source
            $dataSource = DataSource::findOrFail($dataSourceId);
            Log::info('Data source found.', ['data_source' => $dataSource]);

            // Check if metadata is already an array
            $metadata = is_array($dataSource->metadata)
                ? $dataSource->metadata
                : json_decode($dataSource->metadata, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to decode JSON metadata', [
                    'error' => json_last_error_msg(),
                ]);
                return;
            }

            $fileKey        = $metadata['fileKey'] ?? null;
            $organizationId = $dataSource->organization->id; // Use organization ID as Pinecone index
            $pulseId        = $dataSource->pulse_id; // New field for pulse_id as namespace

            if (! $fileKey) {
                throw new \Exception('File key missing in metadata.');
            }

            // Get the correct S3 bucket from config based on the environment
            $bucket = Config::get('zunou.s3.bucket');
            Log::info('Using bucket ' . $bucket);

            // Construct the S3 URL using the bucket and file key
            $s3Url = "s3://$bucket/$fileKey";
            Log::info('S3 URL ' . $s3Url);

            // Select the correct API URL based on the environment
            $env    = Config::get('app.env');
            $apiUrl = match ($env) {
                'production'  => 'http://unstructured.zunou.ai/process',
                'staging'     => 'http://unstructured.staging.zunou.ai/process',
                'development' => 'http://localhost:8080/process',
                default       => 'http://unstructured.development.zunou.ai/process',
            };

            // Prepare the request body with the S3 URL, Pinecone index (organization ID), data source ID, and pulse ID
            $body = [
                's3_url'              => $s3Url,
                'pinecone_index_name' => $organizationId, // Pass the org ID as the index name
                'data_source_id'      => $dataSourceId,
                'data_source_type'    => $dataSource->type,
                'pulse_id'            => $pulseId, // New pulse_id field for namespace
            ];

            // Send the request
            $client = new Client();
            try {
                $response = $client->post($apiUrl, [
                    'json'    => $body,
                    'timeout' => 300, // Set a timeout for the request
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                ]);
            } catch (\GuzzleHttp\Exception\RequestException $e) {
                Log::error(
                    '[AUTOMATION] Failed to process file with unstructured service',
                    [
                        'error'          => $e->getMessage(),
                        'data_source_id' => $dataSourceId,
                        'response'       => $e->getResponse()
                            ? (string) $e->getResponse()->getBody()
                            : null,
                    ],
                );
                throw $e;
            }

            // Handle response
            if ($response->getStatusCode() !== 200) {
                throw new \Exception(
                    'Failed to process file. API response: ' .
                        $response->getBody(),
                );
            }

            // Parse the API response to extract vector IDs
            $responseBody = json_decode((string) $response->getBody(), true);
            if (isset($responseBody['vector_ids'])) {
                $dataSource->vector_ids = json_encode(
                    $responseBody['vector_ids'],
                );
                if (count($responseBody['vector_ids']) > 0) {
                    Log::info('Trying to query the document');
                    $zeroVector = array_fill(0, 1536, 0.0);
                    // Ensure DataSourceHandler is imported: use App\Services\Agents\Handlers\DataSourceHandler;
                    $dataSourceHandler = new \App\Services\Agents\Handlers\DataSourceHandler(
                        $organizationId,
                        $pulseId,
                    );
                    $search_results = [];
                    $maxTries       = 10;
                    $retryCount     = 0;
                    while (
                        count($search_results) === 0 && $retryCount < $maxTries
                    ) {
                        try {
                            $search_results = $dataSourceHandler->query(
                                $zeroVector,
                                100,
                                ['data_source_id' => $dataSourceId],
                            );
                            if (! empty($search_results)) {
                                break;
                            }
                            Log::warning(
                                "Retry attempt $retryCount - No results found.",
                                ['data_source_id' => $dataSourceId],
                            );
                            $retryCount++;
                            sleep(2);
                        } catch (\Exception $e) {
                            Log::error('[AUTOMATION] Vector search failed', [
                                'error'          => $e->getMessage(),
                                'attempt'        => $retryCount,
                                'data_source_id' => $dataSourceId,
                            ]);
                            break; // Exit on error instead of retrying
                        }
                    }
                    if (empty($search_results)) {
                        Log::error(
                            "Failed after $maxTries attempts. Data source may not be ready.",
                        );
                    } else {
                        Log::info('Data source is ready.');
                    }
                }
            }

            Log::info('File processed successfully.');

            // Update the data source status
            $dataSource->status = 'INDEXED';
            $dataSource->save();
        } catch (\Exception $e) {
            Log::error('Error: ' . $e->getMessage());
            $dataSource         = DataSource::findOrFail($dataSourceId);
            $dataSource->status = 'FAILED';
            $dataSource->save();
        }
    }

    private function generateMeetingSummaryHandler(array $arguments): string
    {
        try {
            $arguments = ToolParserHelper::sanitize($arguments);

            $validator = Validator::make($arguments, [
                'meeting_name'       => 'required',
                'data_source_id'     => 'required',
                'user_lookup_prompt' => 'required',
            ]);

            if ($validator->fails()) {
                Log::debug(
                    '[Automation] Invalid arguments passed in generateMeetingSummary tool',
                    $validator->errors()->toArray(),
                );
                return "Invalid arguments received in tool. can't process the request";
            }

            // track the transcript base on meeting transcript
            // if meeting is not yet added, tell the its not yet added

            // check if have meeting but no data source
            $dataSourceRecord = DataSource::find($arguments['data_source_id']);
            if (! $dataSourceRecord) {
                return 'No data source was found with that ID. Did you call the findMeetings tool first? If not, please call it to retrieve the meeting data source.';
            }

            $summary = Summary::where(
                'data_source_id',
                $arguments['data_source_id'],
            )
                ->orderBy('created_at', 'asc')
                ->first();

            if ($summary) {
                return json_encode([
                    'type'    => 'already_exist',
                    'message' => 'Summary already exists for this meeting.',
                    'data'    => [
                        'summary_id' => $summary->id,
                        'text'       => $summary->name,
                    ],
                ]);
            }

            $transcript = Transcript::where(
                'data_source_id',
                $arguments['data_source_id'],
            )->first();

            $dataSourceContent = null;
            $dataSourceId      = $arguments['data_source_id'];

            // handle valid data source id passed
            if ($transcript) {
                $dataSourceContent = $transcript->content;
                $dataSourceId      = $transcript->data_source_id;
            }

            $dataSourceHandler = new DataSourceHandler(
                $this->strategy->organization_id,
                $this->strategy->pulse_id,
            );
            if (! $dataSourceContent) {
                // check if meeting is passed  instead
                $meeting = Meeting::find($arguments['data_source_id']);
                if ($meeting) {
                    $dataSource = $meeting->dataSource;
                    if (! $dataSource) {
                        return 'Meeting is not yet added by the user. Needed to be added first before trying again. Inform the user with a friendly message';
                    }

                    $transcript = $dataSource->transcript;
                    if ($transcript) {
                        $dataSourceContent = $transcript->content;
                        $dataSourceId      = $transcript->data_source_id;
                    }
                }
            }

            if (! $dataSourceContent) {
                $dataSourceContent = $dataSourceHandler->retrieveFullText(
                    $arguments['data_source_id'],
                );
            }

            if (! $dataSourceContent) {
                return 'It looks like you pass different kind of id. Make sure to use lookup tool to get the full information of the meeting.';
            }

            $meetingHelper = new MeetingHelper($this->strategy->pulse);
            $summaryObj    = $meetingHelper->generateSummary(
                $dataSourceContent,
                $this->user->id,
            );

            $action_items = $meetingHelper->parseSumaryResponse(
                $summaryObj['action_items'] ?? [],
            );

            $createdSummary = Summary::create([
                'name'                 => $summaryObj['metadata']['meeting_name'] . ' Summary',
                'pulse_id'             => $this->strategy->pulse_id,
                'user_id'              => $this->user->id,
                'data_source_id'       => $dataSourceId,
                'date'                 => $summaryObj['metadata']['meeting_date'],
                'attendees'            => $summaryObj['metadata']['attendees'],
                'action_items'         => json_encode($action_items),
                'potential_strategies' => json_encode(
                    $summaryObj['potential_strategy'] ?? [],
                ),
                'summary' => MarkdownParser::clean($summaryObj['summary']),
            ]);

            $responseJson = json_encode([
                'summary' => $summaryObj['metadata']['headline'],
                'content' => [
                    [
                        'summary_id' => $createdSummary->id,
                        'text'       => $createdSummary->name,
                    ],
                ],
            ]);

            $createdSummary->toJson();

            return <<<EOD
Here's the generated summary:
$createdSummary

But only send this json on the user as the response.
$responseJson

Strictly return that json only. The created summary will be context if user asks for follow up modification to the summary
EOD;
        } catch (Exception $e) {
            Log::error('[Automation] ' . $e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something wen't wrong. can't process the request";
        }
    }

    private function getMeetingListHandler(array $arguments): string
    {
        try {
            $arguments = ToolParserHelper::sanitize($arguments);

            // Validate strategy and pulse relationship first
            if (! $this->strategy) {
                Log::error('[Automation] Strategy not found', [
                    'automation_id' => $this->id,
                ]);
                return 'Cannot process request: Strategy not found';
            }

            $pulse = $this->strategy->pulse;
            if (! $pulse) {
                Log::error('[Automation] Pulse not found for strategy', [
                    'strategy_id' => $this->strategy->id,
                ]);
                return 'Cannot process request: Pulse not found';
            }

            // Get user using the relationship instead of assigning to model property
            $user = $this->user;
            if (! $user) {
                Log::error('[Automation] User not found', [
                    'automation_id' => $this->id,
                    'user_id'       => $this->user_id,
                ]);
                return 'Cannot process request: User not found';
            }

            // Set date range based on next_run_at
            $toDate   = Carbon::now()->format('Y-m-d H:i:s');
            $fromDate = Carbon::parse($toDate)->subHour();

            $limit = ! empty($arguments['query']['limit'])
                ? $arguments['query']['limit']
                : 15;
            $skip = ! empty($arguments['query']['skip'])
                ? $arguments['query']['skip']
                : 0;
            $keywords = ! empty($arguments['query']['keywords'])
                ? $arguments['query']['keywords']
                : '';

            Log::debug('querying meetings table with the ff args', [
                'strategy_id' => $this->strategy->id,
                'pulse_id'    => $pulse->id,
                'user_id'     => $user->id,
                'fromDate'    => $fromDate,
                'toDate'      => $toDate,
                'byCreatedAt' => true,
                'limit'       => $limit,
                'skip'        => $skip,
                'keywords'    => $keywords,
            ]);

            $meetingHelper = new MeetingHelper();
            $meetings      = $meetingHelper->getMeetingList(
                userId: $user->id,
                pulseId: $pulse->id,
                fromDate: $fromDate,
                toDate: $toDate,
                byCreatedAt: true,
                limit: $limit,
                skip: $skip,
                keywords: $keywords,
            );

            Log::info('[Automation] Found meetings', [
                'count'       => $meetings->count(),
                'strategy_id' => $this->strategy->id,
                'pulse_id'    => $pulse->id,
                'user_id'     => $user->id,
            ]);

            return json_encode([
                'type'    => 'meeting_list',
                'message' => $arguments['acknowledgment'],
                'data'    => [
                    'meetings' => $meetings,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('[Automation] ' . $e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something went wrong. Can't process the request";
        }
    }

    private function notifyNewlyCreatedMeetingSummaryHandler(
        array $arguments,
    ): string {
        try {
            $summary = Summary::find($arguments['summary_id']);
            if (! $summary) {
                return 'The notification failed. Summary not found.';
            }

            $alreadyNotified = \App\Models\Notification::where(
                'summary_id',
                $summary->id,
            )->exists();

            $name          = $summary->name ?? 'Meeting Summary';
            $meetingHelper = new MeetingHelper();

            if ($alreadyNotified) {
                return 'The notification failed. Summary already notified.';
            }

            return $meetingHelper->sendSummaryNotesNotificationOnEmplyees(
                description: "New $name added.",
                type: NotificationType::PULSE->value,
                pulseId: $this->strategy->pulse_id,
                summary_id: $arguments['summary_id'],
            );
        } catch (Exception $e) {
            Log::error('[Automation] ' . $e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something went wrong. Can't process the request";
        }
    }

    private function editMeetingSummaryHandler(array $arguments): string
    {
        try {
            $validator = Validator::make($arguments, [
                'summary_id'         => 'required|string',
                'operations'         => 'required|array',
                'operations.*.field' => [
                    'required',
                    'string',
                    Rule::in([
                        'summary',
                        'name',
                        'date',
                        'attendees',
                        'potential_strategies',
                    ]),
                ],
                'operations.*.updated_value' => 'required|string',
            ]);

            if ($validator->fails()) {
                return 'Invalid parameters passed. Cant update the summary at the moment';
            }

            // Implementation here
            return 'Summary edited successfully';
        } catch (Exception $e) {
            Log::error('[Automation] ' . $e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something went wrong. Can't process the request";
        }
    }

    private function createTasksFromMeetingHandler(array $arguments): string
    {
        try {
            $arguments = ToolParserHelper::sanitize($arguments);

            $validator = Validator::make($arguments, [
                'data_source_id' => 'required|string',
                'acknowledgment' => 'required|string',
            ]);

            if ($validator->fails()) {
                Log::debug(
                    '[Automation] Invalid arguments passed in createTasksFromMeeting tool',
                    $validator->errors()->toArray(),
                );
                return 'Invalid parameters passed. Cannot process the request.';
            }

            // Get the meeting data source
            $dataSource = DataSource::find($arguments['data_source_id']);
            if (! $dataSource) {
                return 'No data source found with the provided ID.';
            }

            // Get the meeting
            $meeting = Meeting::where(
                'data_source_id',
                $dataSource->id,
            )->first();
            if (! $meeting) {
                return 'No meeting found for this data source.';
            }

            // Get the summary
            $summary = Summary::where('data_source_id', $dataSource->id)
                ->orderBy('created_at', 'asc')
                ->first();

            if (! $summary) {
                return 'No summary found for this meeting. Please generate a summary first.';
            }

            // Process action items from summary
            $actionItems = json_decode($summary->action_items, true);
            if (empty($actionItems)) {
                return 'No action items found in the meeting summary.';
            }

            // Create tasks using TaskAgent
            $taskAgent = new \App\Services\Agents\SubAgents\TaskAgent(
                $this->strategy->pulse,
            );
            $tasks = $taskAgent->processMeetingTasks(
                $actionItems,
                $this->strategy->pulse->organization_id,
                $this->strategy->pulse_id,
            );

            // Create tasks in database
            foreach ($tasks as $taskData) {
                // Map status to enum values
                $status = match ($taskData['status'] ?? 'TODO') {
                    'Not Started' => 'TODO',
                    'In Progress' => 'INPROGRESS',
                    'Done'        => 'COMPLETED',
                    default       => 'TODO',
                };

                // Map priority to enum values
                $priority = match ($taskData['priority'] ?? 'MEDIUM') {
                    'Low'    => 'LOW',
                    'Medium' => 'MEDIUM',
                    'High'   => 'HIGH',
                    'Urgent' => 'URGENT',
                    default  => 'MEDIUM',
                };

                $taskData = new \App\DataTransferObjects\Task\TaskData(
                    title: $taskData['title'],
                    description: $taskData['description'] ?? '',
                    organization_id: $this->strategy->pulse->organization_id,
                    status: $status,
                    priority: $priority,
                    type: 'TASK',
                    source: new \App\DataTransferObjects\Task\SourceData(
                        type: \App\Enums\TaskSource::MEETING->value,
                        id: $meeting->id,
                    ),
                );

                $createTaskAction = app(
                    \App\Actions\Task\CreateTaskAction::class,
                );
                $createTaskAction->handle($this->strategy->pulse, $taskData);
            }

            return json_encode([
                'type'    => 'success',
                'message' => $arguments['acknowledgment'],
                'data'    => [
                    'tasks_created' => count($tasks),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('[Automation] ' . $e->getMessage(), [
                'line_number' => $e->getLine(),
                'file'        => $e->getFile(),
                'class'       => get_class($e),
                'trace'       => $e->getTraceAsString(),
                'method'      => __METHOD__,
            ]);
            return "Something went wrong. Can't process the request.";
        }
    }

    public function run(
        bool $isScheduled = false,
        ?string $dataSourceId = null,
    ): bool {
        $logs   = [];
        $logs[] = [
            'level'   => 'info',
            'message' => 'Starting automation run',
            'context' => [],
        ];

        $strategy = $this->strategy;
        if (! $strategy) {
            $logs[] = [
                'level'   => 'error',
                'message' => 'Automation has no associated strategy',
                'context' => ['automation_id' => $this->id],
            ];
            $this->saveLogs($logs);
            return false;
        }

        // Add additional strategy validation if needed
        if (! $strategy->pulse_id) {
            $logs[] = [
                'level'   => 'error',
                'message' => 'Strategy has no associated pulse',
                'context' => ['strategy_id' => $strategy->id],
            ];
            $this->saveLogs($logs);
            return false;
        }

        $description = $strategy->prompt_description;
        if (empty($description)) {
            $logs[] = [
                'level'   => 'error',
                'message' => 'Strategy has no description',
                'context' => ['strategy_id' => $strategy->id],
            ];
            $this->saveLogs($logs);
            return false;
        }

        $result = false;
        try {
            $functions    = $this->getFunctionCalls();
            $systemPrompt = 'You are an AI assistant that helps with automation tasks. ' .
                "Please analyze the user's request and use the appropriate tools to accomplish the task. " .
                'The task is run at ' .
                Carbon::now()->format('Y-m-d H:i:s') .
                '. Make sure you use this as reference for tasks that involves time' .
                'Execute all required steps automatically without asking for confirmation. ' .
                'After retrieving the meeting list, make sure to send the notification.';

            if (isset($dataSourceId)) {
                $systemPrompt .= 'The data source is provided, please bypass the getMeetingList tool and use the data source id. ' .
                    'The data source id is ' .
                    $dataSourceId .
                    '.';
            }

            $messages = [
                [
                    'role'    => 'system',
                    'content' => $systemPrompt,
                ],
                [
                    'role'    => 'user',
                    'content' => $description,
                ],
            ];

            $openAI               = \OpenAI::client(config('zunou.openai.api_key'));
            $continueConversation = true;

            while ($continueConversation) {
                $response = $openAI->chat()->create([
                    'model'         => config('zunou.openai.model'),
                    'messages'      => $messages,
                    'functions'     => $functions,
                    'function_call' => 'auto',
                    // 'temperature'   => 0.7,
                ]);

                if (empty($response)) {
                    $logs[] = [
                        'level'   => 'error',
                        'message' => 'OpenAI returned empty response',
                        'context' => [
                            'automation_id' => $this->id,
                            'strategy_id'   => $strategy->id,
                        ],
                    ];
                    $this->saveLogs($logs);
                    return false;
                }

                $message = $response['choices'][0]['message'];

                // Check if there's a function call to process
                if (isset($message['function_call'])) {
                    $functionCall = $message['function_call'];
                    $functionName = $functionCall['name'] ?? null;
                    $arguments    = json_decode(
                        $functionCall['arguments'] ?? '',
                        true,
                    );

                    if (! $functionName || $arguments === null) {
                        $logs[] = [
                            'level'   => 'error',
                            'message' => 'Invalid function call: ' .
                                json_last_error_msg(),
                        ];
                        continue;
                    }

                    // Log before function call
                    $logs[] = [
                        'level'   => 'info',
                        'message' => 'Executing function call',
                        'context' => [
                            'function'  => $functionName,
                            'arguments' => json_encode($arguments),
                        ],
                    ];

                    $result = $this->handleFunctionCall(
                        $functionName,
                        $arguments,
                    );

                    // Log after function call
                    $logs[] = [
                        'level'   => 'info',
                        'message' => 'Function call completed',
                        'context' => [
                            'function' => $functionName,
                            'result'   => $result,
                        ],
                    ];

                    // Add the assistant's message with function call
                    $messages[] = [
                        'role'          => 'assistant',
                        'content'       => null,
                        'function_call' => [
                            'name'      => $functionName,
                            'arguments' => json_encode($arguments),
                        ],
                    ];

                    // Add the function's response
                    $messages[] = [
                        'role'    => 'function',
                        'name'    => $functionName,
                        'content' => $result,
                    ];
                } else {
                    $continueConversation = false;
                }
            }

            $logs[] = [
                'level'   => 'info',
                'message' => 'Automation run completed successfully',
            ];
            $result = true;
        } catch (Exception $e) {
            $logs[] = [
                'level'   => 'error',
                'message' => 'Error running automation',
                'context' => [
                    'error'         => $e->getMessage(),
                    'automation_id' => $this->id,
                    'strategy_id'   => $strategy->id,
                ],
            ];
            $result = false;
        } finally {
            // Update next_run_at based on automation type, using the previous next_run_at as reference
            $baseTime = Carbon::parse($this->next_run_at);
            if ($isScheduled) {
                $next_run_at = $baseTime->addHour();
            } else {
                $next_run_at = $baseTime;
            }
            $this->update([
                'next_run_at' => $next_run_at,
            ]);

            // Save all collected logs in a single entry
            $this->saveLogs($logs);
        }
        return $result;
    }

    private function saveLogs(array $logs): void
    {
        // Format the logs array
        $formattedLogs = array_map(function ($log) {
            $formattedLog = [
                'level'   => $log['level'],
                'message' => $log['message'],
            ];

            // Format context as array of strings if it exists
            if (! empty($log['context'])) {
                $contextStrings = [];
                foreach ($log['context'] as $key => $value) {
                    if (is_array($value)) {
                        $contextStrings[] = "$key: " . json_encode($value);
                    } else {
                        $contextStrings[] = "$key: $value";
                    }
                }
                $formattedLog['context'] = $contextStrings;
            }

            return $formattedLog;
        }, $logs);

        // Create a single log entry with all logs for this run
        $logEntry = [
            'run_at' => now()->toIso8601String(),
            'logs'   => $formattedLogs,
        ];

        activity()
            ->performedOn($this)
            ->withProperties($logEntry)
            ->log('Automation run completed');
    }
}
