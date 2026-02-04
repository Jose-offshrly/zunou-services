<?php

namespace App\Traits;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

trait OpenAiAttributes
{
    /**
     * Encrypt the OpenAI API key before saving to the database
     */
    public function setOpenaiApiKeyAttribute($value)
    {
        if ($value === null) {
            $this->attributes['openai_api_key'] = null;
        } else {
            $this->attributes['openai_api_key'] = Crypt::encryptString($value);
        }
    }

    /**
     * Decrypt the OpenAI API key when retrieving from the database
     */
    public function getOpenaiApiKeyAttribute($value)
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            Log::error('Failed to decrypt OpenAI API key: ' . $e->getMessage());
            return null;
        }
    }
}

