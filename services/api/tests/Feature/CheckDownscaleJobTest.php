<?php

namespace Tests\Feature;

use App\Jobs\CheckDownscaleJob;
use App\Services\SchedulerScaleService;
use Mockery;
use Tests\TestCase;

class CheckDownscaleJobTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_handles_successful_response_with_no_downscale_needed(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 3 running instances and 2 active meetings (difference = 1)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'ecs'      => ['running' => 3],
                'meetings' => ['active' => 2],
            ]);

        // Should not call triggerScale
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job
        $job->handle();

        // Assertions are handled by Mockery expectations
        $this->assertTrue(true);
    }

    public function test_skips_downscale_when_difference_is_exactly_1(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 2 running instances and 1 active meeting (difference = 1)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'ecs'      => ['running' => 2],
                'meetings' => ['active' => 1],
            ]);

        // Should not call triggerScale
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_skips_downscale_when_difference_is_exactly_2(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 4 running instances and 2 active meetings (difference = 2)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'ecs'      => ['running' => 4],
                'meetings' => ['active' => 2],
            ]);

        // Should not call triggerScale when difference is exactly 2 (need >= 3)
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_triggers_downscale_when_difference_is_3_or_more(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 5 running instances and 2 active meetings (difference = 3)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'ecs'      => ['running' => 5],
                'meetings' => ['active' => 2],
            ]);

        // Should call triggerScale with 'down' direction
        $mockService->shouldReceive('triggerScale')
            ->once()
            ->with('down', config('app.env'))
            ->andReturn(['success' => true]);

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_handles_invalid_response_structure(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with missing required fields
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'ecs' => ['running' => 3],
                // Missing 'meetings' => ['active' => 2]
            ]);

        // Should not call triggerScale
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_handles_exception_during_execution(): void
    {
        // Mock the SchedulerScaleService to throw an exception
        $mockService = Mockery::mock(SchedulerScaleService::class);

        $mockService->shouldReceive('getStatus')
            ->once()
            ->andThrow(new \Exception('Service unavailable'));

        // Should not call triggerScale
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job - should not throw exception
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_edge_case_exactly_2_instances_left(): void
    {
        // This test specifically addresses the requirement: "don't downscale when only 2 instance is left"
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 2 running instances and 0 active meetings (difference = 2)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'ecs'      => ['running' => 2],
                'meetings' => ['active' => 0],
            ]);

        // Should not call triggerScale when only 2 instances are left
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckDownscaleJob($mockService);

        // Execute the job
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_various_downscale_scenarios(): void
    {
        $testCases = [
            // [running, active, shouldDownscale, description]
            [1, 0, false, '1 running, 0 active - should not downscale (only 1 left)'],
            [2, 0, false, '2 running, 0 active - should not downscale (only 2 left)'],
            [2, 1, false, '2 running, 1 active - should not downscale (only 2 left)'],
            [3, 1, false, '3 running, 1 active - should not downscale (difference = 2)'],
            [3, 0, true, '3 running, 0 active - should downscale (difference = 3)'],
            [4, 1, true, '4 running, 1 active - should downscale (difference = 3)'],
            [5, 2, true, '5 running, 2 active - should downscale (difference = 3)'],
            [6, 1, true, '6 running, 1 active - should downscale (difference = 5)'],
        ];

        foreach ($testCases as [$running, $active, $shouldDownscale, $description]) {
            $mockService = Mockery::mock(SchedulerScaleService::class);

            $mockService->shouldReceive('getStatus')
                ->once()
                ->andReturn([
                    'ecs'      => ['running' => $running],
                    'meetings' => ['active' => $active],
                ]);

            if ($shouldDownscale) {
                $mockService->shouldReceive('triggerScale')
                    ->once()
                    ->with('down', config('app.env'))
                    ->andReturn(['success' => true]);
            } else {
                $mockService->shouldNotReceive('triggerScale');
            }

            // Create job instance with mocked service
            $job = new CheckDownscaleJob($mockService);

            // Execute the job
            $job->handle();

            $this->assertTrue(true, $description);
        }
    }
}
