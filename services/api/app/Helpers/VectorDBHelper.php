<?php

namespace App\Helpers;

use Exception;
use Illuminate\Support\Facades\Log;

class VectorDBHelper
{
    private static $indexDescriptions = []; // Cache for index descriptions

    public static function setIndexHost($pinecone, $indexName)
    {
        // Check if we have a cached description for this index
        /* if (isset(self::$indexDescriptions[$indexName])) {
            $indexDesc = self::$indexDescriptions[$indexName];
            Log::info('Using cached index description for: ' . $indexName);
        } else { */
        // Fetch the index description from Pinecone API
        try {
            $indexDesc = $pinecone->control()->index($indexName)->describe();
            if (! $indexDesc->successful()) {
                throw new Exception('Failed to describe index: ' . $indexName);
            }

            Log::info('Retrieved index description for: ' . $indexName);
            $indexInfo = json_decode($indexDesc->body(), true);

            // Cache the description
            self::$indexDescriptions[$indexName] = $indexDesc;

            // check if `host` is is the indexInfo
            if (! isset($indexInfo['host'])) {
                throw new Exception('Index host is not in the index info');
            } else {
                $indexHost = 'https://' . $indexInfo['host'];
            }

            // Set the index host
            $pinecone->setIndexHost($indexHost);

            Log::info('Index host set to: ' . $indexHost);
        } catch (Exception $e) {
            Log::error('Error in setIndexHost: ' . $e->getMessage());
            throw $e;
        }
        //}

        return $pinecone;
    }
}
