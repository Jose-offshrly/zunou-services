<?php

namespace App\Console\Commands;

use App\Helpers\VectorDBHelper;
use App\Models\Organization;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use OpenAI;
use Probots\Pinecone\Client as Pinecone;

class UpdatePineconeMetadata extends Command
{
    protected $signature   = 'pinecone:update-metadata';
    protected $description = 'Query Pinecone with embeddings, update "chunk" to "text," and generate new embeddings.';

    // Define top K value for the query
    protected const TOP_K = 100;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Fetch all organization IDs
        $organizations = Organization::all('id');

        foreach ($organizations as $organization) {
            $organizationId = $organization->id;
            $this->info("Processing organization with ID: $organizationId");

            try {
                // Set the organization-specific index
                $pinecone = $this->getPineconeClient($organizationId);

                // Query the index with embedding
                $keyword       = 'company'; // Use "company" as the example keyword for querying
                $embeddedQuery = $this->getEmbedding($keyword);

                // Query Pinecone with the embedding
                $response = $pinecone
                    ->data()
                    ->vectors()
                    ->query(vector: $embeddedQuery, topK: self::TOP_K);

                if (! $response->successful()) {
                    throw new Exception(
                        'Failed to query the data against the vector db.',
                    );
                }

                // Loop through the results and update metadata
                $matches = $response->json()['matches'] ?? [];

                if (empty($matches)) {
                    $this->info(
                        "No matching vectors found for organization: $organizationId",
                    );
                    continue;
                }

                foreach ($matches as $match) {
                    $vectorId = $match['id'];
                    $metadata = $match['metadata'] ?? [];

                    // Check if the "chunk" field exists
                    if (isset($metadata['chunk'])) {
                        $this->info(
                            "Updating vector ID: $vectorId for organization: $organizationId",
                        );

                        // Move "chunk" to "text"
                        $metadata['text'] = $metadata['chunk'];
                        unset($metadata['chunk']);

                        // Generate a new embedding for the updated "text"
                        $newEmbedding = $this->getEmbedding($metadata['text']);

                        // Prepare the updated vector with new embedding and metadata
                        $updatedVector = [
                            'id'       => $vectorId,
                            'values'   => $newEmbedding, // Use the newly generated embedding
                            'metadata' => $metadata, // Updated metadata with "text"
                        ];

                        // Upsert the vector with the updated embedding and metadata
                        $pinecone
                            ->data()
                            ->vectors()
                            ->upsert([$updatedVector]);
                    }
                }

                $this->info(
                    "Completed processing for organization ID: $organizationId",
                );
            } catch (Exception $e) {
                // Log and display errors
                Log::error(
                    "Error processing organization $organizationId: " .
                        $e->getMessage(),
                );
                $this->error(
                    "Error processing organization $organizationId: " .
                        $e->getMessage(),
                );
            }
        }

        $this->info(
            'Pinecone metadata update with embedding query completed for all organizations.',
        );
    }

    /**
     * Get the Pinecone client for the specified organization ID.
     */
    private function getPineconeClient($orgId)
    {
        $indexName = $orgId;
        $pinecone  = VectorDBHelper::setIndexHost(
            new Pinecone(Config::get('zunou.pinecone.api_key')),
            $indexName,
        );
        return $pinecone;
    }

    /**
     * Get the embedding vector for the given text.
     */
    private function getEmbedding($text)
    {
        // Get the vector embedding of the text using OpenAI API
        $client    = OpenAI::client(Config::get('zunou.openai.api_key'));
        $embedding = $client->embeddings()->create([
            'model' => Config::get('zunou.openai.embedding_model'),
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
}
