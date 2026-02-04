<?php

namespace App\Traits;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

trait AssemblyAiAttributes
{
    /**
     * Encrypt the AssemblyAI API key before saving to the database
     */
    public function setAssemblyaiKeyAttribute($value)
    {
        if ($value === null) {
            $this->attributes['assemblyai_key'] = null;
        } else {
            $this->attributes['assemblyai_key'] = Crypt::encryptString($value);
        }
    }

    /**
     * Decrypt the AssemblyAI API key when retrieving from the database
     */
    public function getAssemblyaiKeyAttribute($value)
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            Log::error(
                'Failed to decrypt AssemblyAI API key: ' . $e->getMessage()
            );
            return null;
        }
    }
}
