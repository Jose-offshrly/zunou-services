<?php

namespace Tests\Feature;

use App\Jobs\ProcessTranslationJob;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class ProcessTranslationJobTest extends TestCase
{
    /**
     * Test the ProcessTranslationJob with hardcoded parameters.
     */
    public function test_process_translation_job_runs_successfully(): void
    {
        // Hardcoded test parameters
        $sourceDataSourceId = '9d861408-97bd-4e27-b541-1a8f957bc2f6';
        $targetDataSourceId = '0785ad39-6b6b-47d0-91f5-98600500abbf';
        $targetLanguage     = 'es'; // Spanish as an example

        // Log for debugging purposes
        Log::info('Running ProcessTranslationJob test', [
            'source_id' => $sourceDataSourceId,
            'target_id' => $targetDataSourceId,
            'language'  => $targetLanguage,
        ]);

        // Create an instance of the job
        $job = new ProcessTranslationJob(
            $sourceDataSourceId,
            $targetDataSourceId,
            $targetLanguage,
        );

        // Assert that no exceptions are thrown during execution
        try {
            $job->handle();

            // If no exception is thrown, test passes
            Log::info('ProcessTranslationJob test completed successfully');
            $this->assertTrue(
                true,
                'ProcessTranslationJob completed successfully',
            );
        } catch (\Exception $e) {
            // If an exception is thrown, fail the test
            Log::error('ProcessTranslationJob test failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            $this->fail(
                'ProcessTranslationJob encountered an exception: ' .
                    $e->getMessage(),
            );
        }
    }
}
