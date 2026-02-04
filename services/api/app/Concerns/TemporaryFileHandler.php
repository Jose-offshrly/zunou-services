<?php

namespace App\Concerns;

use App\DataTransferObjects\TemporaryFileData;

trait TemporaryFileHandler
{
    // returns the path of the temporary created summary file
    private function storeTemporaryFile(
        string $dataSourceId,
        string $summaryContent,
    ): TemporaryFileData {
        // Define the temporary file path and use specified filename if provided
        $tempDir      = storage_path('app/tmp');
        $fileName     = "{$dataSourceId}.txt";
        $tempFilePath = "{$tempDir}/{$fileName}"; // Write content to a temporary file

        // Ensure the directory exists
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true); // Create the directory if it doesn't exist
        }

        file_put_contents($tempFilePath, $summaryContent);

        return new TemporaryFileData(
            fileName: $fileName,
            tempFilePath: $tempFilePath,
        );
    }
}
