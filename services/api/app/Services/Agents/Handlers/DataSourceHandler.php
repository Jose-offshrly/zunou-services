<?php

namespace App\Services\Agents\Handlers;

use App\Models\DataSource;
use App\Services\VectorDBService;
use Illuminate\Support\Facades\Log;

class DataSourceHandler
{
    public function __construct(public string $orgId, public string $pulseId)
    {
    }
    public function search(string $query, ?array $metadataFilter = [])
    {
        $metadataFilter['isDeleted'] = [
            '$ne' => true,
        ];

        $search_results = app(VectorDBService::class)->search(
            $query,
            $this->orgId,
            $this->pulseId,
            $metadataFilter,
        );

        return $search_results;
    }

    public function query(
        array $vector,
        ?int $topK = 100,
        ?array $metadataFilter = [],
    ) {
        $metadataFilter['isDeleted'] = [
            '$ne' => true,
        ];

        return app(VectorDBService::class)->query(
            $vector,
            $this->orgId,
            $this->pulseId,
            $topK,
            $metadataFilter,
        );
    }

    public function getRelevantDocument(
        string $query,
        string $retrieved_documents,
    ) {
        $TOKEN_LIMIT = 127000;
        $prompt      = "You are an assistant expert in identifying relevant document from list of documents based only on the query. pick the most relevant.
        
        Notes on 'meeting' Data Sources:
        - if the query includes dates, and meeting names, choose the closest one and if possible exact
        - If multiple meeting records have the same name, pick the most recent one.

        Notes on other data sources
        - Handling Duplicates or similar sources:
            It is possible to have document chunks that is completely similar. User can upload big file and also upload multiple parts of that exact same file.

            How can you determine which one?
            Refer to 'Document Token Count' value. Pick the document with lowest token count(valid integer)

            Some documents have empty token count value of ''.
            The only time you will pick document without token count is when thats the only relevant source out of the choices.
      
        - Final Selection:
            Choose the most relevant document based on the above criteria.

        Here are the retrieved documents:\n\n";

        $prompt .= $retrieved_documents;

        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'get_relevant_data_source',
                'schema' => [
                    'properties' => [
                        'hasReleventDataSource' => ['type' => 'boolean'],
                        'dataSource'            => [
                            'anyOf' => [
                                [
                                    'properties' => [
                                        'data_source_id' => [
                                            'title'       => 'Data Soure Id',
                                            'type'        => 'string',
                                            'description' => 'The data source id of document in a valid UUID format',
                                        ],
                                        'name' => [
                                            'title' => 'Name',
                                            'type'  => 'string',
                                        ],
                                        'data_source_type' => [
                                            'title' => 'Data Source Type',
                                            'type'  => 'string',
                                        ],
                                        'data_source_origin' => [
                                            'title' => 'Data Source Origin',
                                            'type'  => 'string',
                                        ],
                                        'document_token_count' => [
                                            'title' => 'Document Token Count',
                                            'type'  => 'integer',
                                        ],
                                    ],
                                    'required' => [
                                        'data_source_id',
                                        'name',
                                        'data_source_type',
                                        'data_source_origin',
                                        'document_token_count',
                                    ],
                                    'title'                => 'DataSource',
                                    'type'                 => 'object',
                                    'additionalProperties' => false,
                                ],
                                ['type' => 'null'],
                            ],
                        ],
                    ],
                    'required'             => ['hasReleventDataSource', 'dataSource'],
                    'additionalProperties' => false,
                    'type'                 => 'object',
                ],
                'strict' => true,
            ],
        ];

        $openAI   = \OpenAI::client(config('zunou.openai.api_key'));
        $response = $openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
                [
                    'role'    => 'user',
                    'content' => $query,
                ],
            ],
            'response_format' => $schema,
            // 'temperature'     => 0.7,
        ]);

        return json_decode($response['choices'][0]['message']['content'], true);
    }

    public function retrieveFullText($dataSourceId)
    {
        $zeroVector     = array_fill(0, 1536, 0.0);
        $search_results = $this->query($zeroVector, 100, [
            'data_source_id' => $dataSourceId,
        ]);

        // order documents if page number and chunk number is set
        if (
            isset($search_results[0]['metadata']['page_number']) && isset($search_results[0]['metadata']['page_number'])
        ) {
            usort($search_results, function ($a, $b) {
                $pageDiff = $a['metadata']['page_number'] - $b['metadata']['page_number'];
                if ($pageDiff !== 0) {
                    return $pageDiff;
                }
                return $a['metadata']['chunk_number'] - $b['metadata']['chunk_number'];
            });
        }

        $dataSource = DataSource::find($dataSourceId);
        //Log::info(['DataSourceHandler, datasource' => $dataSource]);
        $fulltext = $this->formatDocuments($search_results, $dataSource);

        return $fulltext;
    }

    private function formatDocuments(
        array $rawDocuments,
        DataSource $dataSource,
    ) {
        $responseText = '';
        $responseText .= '# Document Name: ' . $dataSource->name . "\n";
        $responseText .= '- Data Source ID: ' . (string) $dataSource->id . "\n";
        $responseText .= '- Data Source Type: ' . $dataSource->type . "\n";
        $responseText .= '- Data Source origin: ' . $dataSource->origin->value . "\n\n";

        $currentPage = -1;
        foreach ($rawDocuments as $matchedVector) {
            $matchedVectorMeta = $matchedVector['metadata'];
            $content           = $matchedVectorMeta['chunk'] ?? ($matchedVectorMeta['text'] ?? 'No content available');

            if ($dataSource->origin->value === 'meeting') {
                $content = preg_replace("/\n{2,}/", "\n", $content);
            }

            $pageNumber  = $matchedVectorMeta['page_number']  ?? 1;
            $chunkNumber = $matchedVectorMeta['chunk_number'] ?? '--';

            if ($pageNumber != $currentPage) {
                $responseText .= "## Page $pageNumber\n\n";
            }
            $currentPage = $pageNumber;
            $responseText .= "### Chunk $chunkNumber\n";
            $responseText .= $content . "\n\n";
        }
        return $responseText;
    }
}
