<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class LoadDataSourceService
{
    public const DATA_SAMPLING_ROWS = 5;

    public static function getEmbedding($text, $model)
    {
        // Get the vector embedding of the text
        $client    = \OpenAI::client(config('zunou.openai.api_key'));
        $embedding = $client->embeddings()->create([
            'model' => $model,
            'input' => $text,
        ]);

        if (! $embedding) {
            throw new \Exception('No embedding came back from openai.');
        }
        return $embedding;
    }

    public static function setPineconeIndexHost($pinecone, $indexName)
    {
        $indexDesc = $pinecone->control()->index($indexName)->describe();

        if ($indexDesc->successful()) {
            $indexInfo = json_decode($indexDesc->body(), true);
            // print out
            Log::info('Retrieved index info: ' . $indexDesc->body());

            // check if `host` is is the indexInfo
            if (! isset($indexInfo['host'])) {
                // throw exception
                throw new \Exception('Index host is not in the index info');
            } else {
                $indexHost = 'https://' . $indexInfo['host'];
            }

            // set the index host
            $pinecone->setIndexHost($indexHost);

            Log::info('Index host set to: ' . $indexHost);
        } else {
            // throw exception
            throw new \Exception('Failed to get index info');
        }

        return $pinecone;
    }

    /**
     * Get a summary of the content using OpenAI.
     *
     * @param string $content
     * @return string
     * @throws \Exception
     */
    public static function getSummaryFromOpenAI($content)
    {
        $client = \OpenAI::client(config('zunou.openai.api_key'));

        try {
            $response = $client->chat()->create([
                'model'    => 'gpt-3.5-turbo', // Chat model
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'You are a helpful assistant that summarizes content. I dont have time to read the whole thing, can you summarize it for me?',
                    ],
                    [
                        'role'    => 'user',
                        'content' => "Please provide a shortened version of the following content just giving the main points without mentioning that you are providing a summary. Try to keep it to within about 100 words.  Dont start with 'The content', don't break it down by chapter or section, just provide a shortened summary of what the entire document contains.  Here is the content :\n\n" .
                            $content,
                    ],
                ],
                'max_tokens'  => 150, // Adjust based on desired summary length
                'temperature' => 0.5, // Temperature for balanced responses
            ]);

            if (! isset($response['choices'][0]['message']['content'])) {
                throw new Exception('No summary returned from OpenAI.');
            }

            return trim($response['choices'][0]['message']['content']);
        } catch (Exception $e) {
            Log::error(
                'Error generating summary from OpenAI: ' . $e->getMessage(),
            );
            throw new Exception('Failed to get summary from OpenAI.');
        }
    }
}
