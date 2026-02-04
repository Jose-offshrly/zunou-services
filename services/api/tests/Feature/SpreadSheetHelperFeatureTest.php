<?php

namespace Tests\Feature\Services\Agents\Helpers;

use App\Services\Agents\Helpers\SpreadsheetHelper;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SpreadsheetHelperFeatureTest extends TestCase
{
    public function test_lookup_spreadsheet_with_real_data(): void
    {
        // Define the file key and prompt for the test
        $fileKey = 'organizations/9b/a1/26/7e/8cd5-4f9b-80b5-0c5c21f71f95/data-sources/43/d5/45/15/afb4-44cb-a5d2-6b54658cfd90.xlsx'; // Replace with an actual file key in your S3 bucket
        $prompt  = 'What are the sales figures for Q1 2014?';

        // Instantiate the helper
        $helper = new SpreadsheetHelper();

        // Run the lookupSpreadsheet method
        $result = $helper->lookupSpreadsheet($prompt, $fileKey);

        // Log and assert the result
        Log::info('lookupSpreadsheet Result:', ['result' => $result]);

        $this->assertNotNull($result, 'The result should not be null.');
        $this->assertIsArray($result, 'The result should be an array.');
    }
}
