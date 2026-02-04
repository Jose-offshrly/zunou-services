<?php

namespace App\Services;

use App\Helpers\VectorDBHelper;
use App\Models\DataSource;
use Exception;
use Illuminate\Support\Facades\Log;
use Probots\Pinecone\Client as Pinecone;

class VectorDBService
{
    public static $MAX_RETRIES            = 4;
    private static $pineconeInstance      = null;
    public static $VECTOR_SCORE_THRESHOLD = 0.25;

    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('zunou.pinecone.api_key');
        // // Ensure we only instantiate Pinecone once and reuse it.
        // if (self::$pineconeInstance === null && $this->apiKey !== null) {
        //     self::$pineconeInstance = new Pinecone($this->apiKey);
        // }
    }

    public function getPineconeClient()
    {
        return new Pinecone($this->apiKey);
    }

    private function executeWithRetry(callable $callback)
    {
        $attempts = 0;
        while ($attempts < self::$MAX_RETRIES) {
            try {
                $response = $callback();
                if ($response->successful()) {
                    return $response;
                }
                Log::warning(
                    'Pinecone request failed, attempt ' . ($attempts + 1),
                );
            } catch (Exception $e) {
                Log::error(
                    'Attempt ' .
                        ($attempts + 1) .
                        ' failed: ' .
                        $e->getMessage(),
                );
            }
            $attempts++;
            sleep(1);
        }
        throw new Exception(
            'Pinecone request failed after ' . self::$MAX_RETRIES . ' attempts.',
        );
    }

    public function addOrUpdateDataInVectorDB(
        $itemId,
        $data,
        $orgId,
        $dataSourceId,
        $dataSourceName,
        $dataSourceType,
        $pulseId,
    ) {
        try {
            // Get the vector embedding for the data
            Log::info('Setting index host for orgId: ' . $orgId);

            $embedding = self::getEmbedding($data);

            // Set the index host
            $indexName = $orgId;
            $pinecone  = $this->getPineconeClient();
            $pinecone  = VectorDBHelper::setIndexHost($pinecone, $indexName);

            // Ensure $itemId is a string
            if (is_int($itemId)) {
                $itemId = (string) $itemId;
            }

            // Use upsert to add or update the data in the vector database
            $response = $this->executeWithRetry(function () use (
                $pinecone,
                $itemId,
                $embedding,
                $orgId,
                $dataSourceId,
                $dataSourceName,
                $dataSourceType,
                $data,
                $pulseId
            ) {
                return $pinecone->data()->vectors()->upsert(
                    vectors: [
                        'id'       => $itemId,
                        'values'   => $embedding,
                        'metadata' => [
                            'org_id'           => $orgId,
                            'data_source_id'   => $dataSourceId,
                            'data_source_name' => $dataSourceName,
                            'data_source_type' => $dataSourceType,
                            'text'             => $data,
                        ],
                    ],
                    namespace: $pulseId,
                );
            });

            if (! $response->successful()) {
                throw new Exception(
                    'Failed to add or update data in vector DB.',
                );
            }

            Log::info(
                'Data successfully added or updated in vector DB for item ' .
                    $itemId,
            );
        } catch (Exception $e) {
            Log::error(
                'Error adding or updating data in vector DB: ' .
                    $e->getMessage(),
            );
            throw $e;
        }
    }

    /**
     * General helper for inserting items in pinecone
     */
    public function upsertVectors($orgId, $namespace, $documents)
    {
        try {
            Log::info('Setting index host for orgId: ' . $orgId);

            // Set the index host
            $indexName = $orgId;
            $pinecone  = $this->getPineconeClient();
            $pinecone  = VectorDBHelper::setIndexHost($pinecone, $indexName);

            // generate embeddings
            $texts      = collect($documents)->pluck('data')->all();
            $embeddings = $this->getEmbeddings($texts);

            foreach ($documents as $index => &$document) {
                $document['values'] = $embeddings[$index];
                unset($document['data']);
            }

            $response = $this->executeWithRetry(function () use (
                $pinecone,
                $namespace,
                $documents
            ) {
                return $pinecone
                    ->data()
                    ->vectors()
                    ->upsert(vectors: $documents, namespace: $namespace);
            });

            if (! $response->successful()) {
                throw new Exception(
                    'Failed to add or update data in vector DB.',
                );
            }

            $ids = array_values(
                array_map(function ($document) {
                    return $document['id'];
                }, $documents),
            );

            Log::info('Data successfully added or updated in vector DB', $ids);
        } catch (Exception $e) {
            Log::error(
                'Error adding or updating data in vector DB: ' .
                    $e->getMessage(),
            );
            throw $e;
        }
    }

    public static function getEmbedding($text)
    {
        // Get the vector embedding of the text
        $client    = \OpenAI::client(config('zunou.openai.api_key'));
        $embedding = $client->embeddings()->create([
            'model' => config('zunou.openai.embedding_model'),
            'input' => $text,
        ]);

        if (! $embedding) {
            throw new Exception('No embedding came back from OpenAI.');
        }

        if (! isset($embedding['data'][0]['embedding'])) {
            throw new Exception(
                'Failed to get embedding from response: ' .
                    json_encode($embedding),
            );
        }

        return $embedding['data'][0]['embedding'];
    }

    public static function getEmbeddings(array $texts)
    {
        // Get the vector embedding of the text
        $client    = \OpenAI::client(config('zunou.openai.api_key'));
        $embedding = $client->embeddings()->create([
            'model' => config('zunou.openai.embedding_model'),
            'input' => $texts,
        ]);

        if (! $embedding) {
            throw new Exception('No embedding came back from OpenAI.');
        }

        if (! isset($embedding['data'][0]['embedding'])) {
            throw new Exception(
                'Failed to get embedding from response: ' .
                    json_encode($embedding),
            );
        }

        $embeddings = collect($embedding['data'])
            ->pluck('embedding')
            ->all();

        return $embeddings;
    }

    public function search(
        string $prompt,
        string $orgId,
        string $pulseId,
        ?array $metadataFilters = [],
    ): ?string {
        Log::info('[search]: receiving prompt: ' . $prompt);
        Log::info('[search]: namespace: ' . $pulseId);
        try {
            // Set index info based on orgId
            $indexName = $orgId;
            $pinecone  = $this->getPineconeClient();
            $pinecone  = VectorDBHelper::setIndexHost($pinecone, $indexName);

            // Get the embedding for the prompt
            $embeddedQuestion = self::getEmbedding($prompt);

            $response = $this->executeWithRetry(function () use (
                $pinecone,
                $embeddedQuestion,
                $metadataFilters,
                $pulseId
            ) {
                return $pinecone
                    ->data()
                    ->vectors()
                    ->query(
                        vector: $embeddedQuestion,
                        topK: 5,
                        filter: $metadataFilters,
                        namespace: $pulseId,
                    );
            });

            // Check if the query was successful
            if (! $response->successful()) {
                throw new Exception(
                    'Failed to query the data against the vector db.',
                );
            }

            //Log::info('[search]: Retrieved response: ' . $response->body());

            $matchedVectorResp = json_decode($response->body(), true);
            $matchedVectors    = $matchedVectorResp['matches'];

            // Filter vectors based on score threshold
            $matchedVectors = array_filter($matchedVectors, function ($vector) {
                return $vector['score'] > self::$VECTOR_SCORE_THRESHOLD;
            });

            // If no matched vectors found
            if (count($matchedVectors) == 0) {
                Log::info(
                    '[search]: No relevant information found in the documents to answer the question.',
                );
                return null;
            }

            /**
             * This is to add data source origin in each document,
             * meeting data source for example have type "text" not "meeting.
             * So the origin will kick in when identifying if source is meeting
             */
            $dataSourceIds = array_unique(
                array_map(function ($vector) {
                    return $vector['metadata']['data_source_id'];
                }, $matchedVectors),
            );

            $dataSources = DataSource::whereIn('id', $dataSourceIds)->get();

            $idToOriginMapping = [];
            foreach ($dataSources as $item) {
                $idToOriginMapping[$item->id] = [
                    'origin' => $item->origin->value,
                    'name'   => $item->name,
                ];
            }

            $responseText = '';
            foreach ($matchedVectors as $matchedVector) {
                $matchedVectorMeta = $matchedVector['metadata'];

                // Check if the field is "chunk" or "text"
                $content = $matchedVectorMeta['chunk'] ?? ($matchedVectorMeta['text'] ?? 'No content available');

                // Retrieve data_source_id directly from metadata
                $dataSourceId     = $matchedVectorMeta['data_source_id']       ?? 'Unknown Data Source ID';
                $dataSourceType   = $matchedVectorMeta['data_source_type']     ?? 'Unknown Data Source Type';
                $tokenCount       = $matchedVectorMeta['document_token_count'] ?? '';
                $dataSourceOrigin = isset(
                    $idToOriginMapping[$matchedVectorMeta['data_source_id']],
                )
                    ? $idToOriginMapping[$matchedVectorMeta['data_source_id']][
                        'origin'
                    ]
                    : 'Unknown Data Source Origin';
                $dataSourceOrigin = isset(
                    $idToOriginMapping[$matchedVectorMeta['data_source_id']],
                )
                    ? $idToOriginMapping[$matchedVectorMeta['data_source_id']][
                        'origin'
                    ]
                    : 'Unknown Data Source Origin';

                $filename = $matchedVectorMeta['filename'] ?? 'Unknown Document Name';
                if (
                    $dataSourceOrigin === 'meeting' && isset(
                        $idToOriginMapping[$matchedVectorMeta['data_source_id']],
                    )
                ) {
                    $filename = $idToOriginMapping[
                            $matchedVectorMeta['data_source_id']
                        ]['name'];
                }

                $pageNumber  = $matchedVectorMeta['page_number'] ?? 'Unknown Page Number';
                $chunkNumber = isset($matchedVectorMeta['chunk_number'])
                    ? 'Chunk number: ' .
                        $matchedVectorMeta['chunk_number'] .
                        "\n"
                    : '';

                $responseText .= "Document Name: $filename\n";
                $responseText .= "Page Number: $pageNumber\n";
                $responseText .= $chunkNumber;

                $responseText .= 'Data Source ID: ' . $dataSourceId . "\n";
                $responseText .= 'Data Source Type: ' . $dataSourceType . "\n";
                $responseText .= 'Data Source Origin: ' . $dataSourceOrigin . "\n";
                $responseText .= 'Document Token Count: ' . $tokenCount . "\n";
                $responseText .= 'Content: ' . $content . "\n\n";

                $responseText .= "======= Document End =======\n\n";
            }
            return $responseText;
        } catch (Exception $e) {
            Log::error('[search]: error:' . $e->getMessage());
            throw new Exception(
                'Failed to query the data against the data sources.',
            );
        }
    }

    public function query(
        array $vector,
        string $orgId,
        string $pulseId,
        int $topK,
        ?array $metadataFilters = [],
    ): array {
        Log::info('[query]: namespace: ' . $pulseId);
        try {
            // Set index info based on orgId
            $indexName = $orgId;
            $pinecone  = $this->getPineconeClient();
            $pinecone  = VectorDBHelper::setIndexHost($pinecone, $indexName);

            $response = $this->executeWithRetry(function () use (
                $pinecone,
                $vector,
                $topK,
                $metadataFilters,
                $pulseId
            ) {
                return $pinecone
                    ->data()
                    ->vectors()
                    ->query(
                        vector: $vector,
                        topK: $topK,
                        filter: $metadataFilters,
                        namespace: $pulseId,
                    );
            });

            // Check if the query was successful
            if (! $response->successful()) {
                throw new Exception(
                    'Failed to query the data against the vector db.',
                );
            }

            $matchedVectorResp = json_decode($response->body(), true);
            $matchedVectors    = $matchedVectorResp['matches'];

            return $matchedVectors;
        } catch (Exception $e) {
            Log::error('[query]: error:' . $e->getMessage());
            throw new Exception(
                'Failed to query the data against the data sources.',
            );
        }
    }

    public function retrieveTopMatches(
        string $prompt,
        string $orgId,
        string $pulseId,
        $topK = 5,
    ): string {
        Log::info('[retrieveTopMatches]: receiving prompt: ' . $prompt);

        try {
            // get index info
            $indexName = $orgId;
            $pinecone  = $this->getPineconeClient();
            $pinecone  = VectorDBHelper::setIndexHost($pinecone, $indexName);

            $embeddedQuestion = self::getEmbedding($prompt);
            $response         = $pinecone
                ->data()
                ->vectors()
                ->query(
                    vector: $embeddedQuestion,
                    topK: $topK,
                    namespace: $pulseId,
                );

            if (! $response->successful()) {
                throw new Exception(
                    'Failed to query the data against the vector db.',
                );
            }

            Log::info(
                '[retrieveTopMatches]: Retrieved response: ' . $response->body(),
            );

            $matchedVectorResp = json_decode($response->body(), true);
            $matchedVectors    = $matchedVectorResp['matches'];

            // Filter out all the vectors that have a score less than the threshold
            $matchedVectors = array_filter($matchedVectors, function ($vector) {
                return $vector['score'] > self::$VECTOR_SCORE_THRESHOLD;
            });

            // If no matched vectors found
            if (count($matchedVectors) == 0) {
                Log::info(
                    '[retrieveTopMatches]: No relevant information found in the documents to answer the question.',
                );
                return 'There is no relevant information found in the documents to answer the question.';
            }

            // Return content from "chunk" or "text" field
            $response = '';
            foreach ($matchedVectors as $matchedVector) {
                $content = $matchedVector['metadata']['chunk'] ?? ($matchedVector['metadata']['text'] ?? 'No content available');
                $response .= $content . "\n";
            }

            return $response;
        } catch (Exception $e) {
            Log::error('[retrieveTopMatches]: error:' . $e->getMessage());
            Log::error('[retrieveTopMatches]: error:' . $e->getTraceAsString());
            throw new Exception(
                'Failed to query the data against the data sources.',
            );
        }

        return $answer;
    }

    /**
     * Retrieve vector by its Pinecone ID.
     *
     * @param string $pineconeId
     * @param string $orgId
     * @param string $pulseId
     * @return array
     * @throws Exception
     */
    public function retrieveMetaDataById($pineconeId, $orgId, $pulseId)
    {
        try {
            Log::info('Setting index host for orgId: ' . $orgId);
            // Set the index host based on organization ID
            $indexName = $orgId;
            $pinecone  = $this->getPineconeClient();
            $pinecone  = VectorDBHelper::setIndexHost($pinecone, $indexName);
            // Fetch the vector from Pinecone using its ID
            $response = $pinecone
                ->data()
                ->vectors()
                ->fetch([$pineconeId], $pulseId);

            if (! $response->successful()) {
                throw new Exception(
                    'Failed to fetch vector from Pinecone with ID: ' .
                        $pineconeId,
                );
            }

            $vectorData = json_decode($response->body(), true); // Decode JSON body into an associative array
            Log::info(
                'Successfully retrieved vector with Pinecone ID: ' . $pineconeId,
            );
            // Log::info('Vector data: ' . json_encode($vectorData));

            // Check if vectors are present and the ID exists
            if (! isset($vectorData['vectors'][$pineconeId])) {
                throw new Exception(
                    'No vectors found in Pinecone response for ID: ' .
                        $pineconeId,
                );
            }

            // Ensure the vector has metadata
            $metadata = $vectorData['vectors'][$pineconeId]['metadata'] ?? null;
            if (! $metadata) {
                throw new Exception(
                    'No metadata found for vector ID: ' . $pineconeId,
                );
            }

            // Return the metadata
            return $metadata;
        } catch (Exception $e) {
            Log::error(
                'Error retrieving metadata for Pinecone ID ' .
                    $pineconeId .
                    ': ' .
                    $e->getMessage(),
            );
            throw $e;
        }
    }

    public function deleteById($indexName, $namespace, $id)
    {
        $ids = is_array($id) ? $id : [$id];

        Log::info('Deleting vector with id/s', ['ids' => $ids]);

        $pinecone = $this->getPineconeClient();
        $pinecone = VectorDBHelper::setIndexHost($pinecone, $indexName);

        $response = $this->executeWithRetry(function () use (
            $pinecone,
            $ids,
            $namespace
        ) {
            return $pinecone
                ->data()
                ->vectors()
                ->delete(ids: $ids, namespace: $namespace);
        });

        // Check if the query was successful
        if (! $response->successful()) {
            throw new Exception(
                'Failed to remove dummy data in the vector db.',
            );
        }
    }
}
