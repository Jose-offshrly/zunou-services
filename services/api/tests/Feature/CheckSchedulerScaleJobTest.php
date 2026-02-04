<?php

namespace Tests\Feature;

use App\Jobs\CheckSchedulerScaleJob;
use App\Services\SchedulerScaleService;
use Mockery;
use Tests\TestCase;

class CheckSchedulerScaleJobTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_proceeds_when_sufficient_capacity_available(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 4 running instances and 1 active meeting (difference = 3, >= 2)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'success'     => true,
                'environment' => 'staging',
                'timestamp'   => '2025-09-23T05:49:29.627Z',
                'ecs'         => [
                    'desired'     => 4,
                    'running'     => 4,
                    'pending'     => 0,
                    'serviceName' => 'meet-bot-staging',
                    'clusterName' => 'primary-staging',
                    'status'      => 'ACTIVE',
                ],
                'meetings' => [
                    'active' => 1,
                    'total'  => 1205,
                ],
                'capacity' => [
                    'maxInstances'          => 10,
                    'utilizationPercentage' => 40,
                ],
            ]);

        // Should not call triggerScale when capacity is sufficient
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckSchedulerScaleJob($mockService);

        // Execute the job - should not throw exception
        $job->handle();

        $this->assertTrue(true);
    }

    public function test_scales_up_and_throws_exception_when_insufficient_capacity(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with 2 running instances and 1 active meeting (difference = 1, < 2)
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'success'     => true,
                'environment' => 'staging',
                'timestamp'   => '2025-09-23T05:49:29.627Z',
                'ecs'         => [
                    'desired'     => 2,
                    'running'     => 2,
                    'pending'     => 0,
                    'serviceName' => 'meet-bot-staging',
                    'clusterName' => 'primary-staging',
                    'status'      => 'ACTIVE',
                ],
                'meetings' => [
                    'active' => 1,
                    'total'  => 1205,
                ],
                'capacity' => [
                    'maxInstances'          => 10,
                    'utilizationPercentage' => 20,
                ],
            ]);

        // Should call triggerScale with 'up' direction
        $mockService->shouldReceive('triggerScale')
            ->once()
            ->with('up', config('app.env'))
            ->andReturn(['success' => true]);

        // Create job instance with mocked service
        $job = new CheckSchedulerScaleJob($mockService);

        // Execute the job - should throw exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('bot is currenly scaling up. please try again later');

        $job->handle();
    }

    public function test_throws_exception_when_max_instances_reached(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with running instances equal to maxInstances
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'success'     => true,
                'environment' => 'staging',
                'timestamp'   => '2025-09-23T05:49:29.627Z',
                'ecs'         => [
                    'desired'     => 10,
                    'running'     => 10,
                    'pending'     => 0,
                    'serviceName' => 'meet-bot-staging',
                    'clusterName' => 'primary-staging',
                    'status'      => 'ACTIVE',
                ],
                'meetings' => [
                    'active' => 5,
                    'total'  => 1205,
                ],
                'capacity' => [
                    'maxInstances'          => 10,
                    'utilizationPercentage' => 50,
                ],
            ]);

        // Should not call triggerScale when max instances reached
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckSchedulerScaleJob($mockService);

        // Execute the job - should throw exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('bots all used up. please try again later');

        $job->handle();
    }

    public function test_handles_invalid_response_structure(): void
    {
        // Mock the SchedulerScaleService
        $mockService = Mockery::mock(SchedulerScaleService::class);

        // Mock response with missing required fields
        $mockService->shouldReceive('getStatus')
            ->once()
            ->andReturn([
                'success' => true,
                'ecs'     => ['running' => 3],
                // Missing 'meetings' => ['active' => 1]
            ]);

        // Should not call triggerScale
        $mockService->shouldNotReceive('triggerScale');

        // Create job instance with mocked service
        $job = new CheckSchedulerScaleJob($mockService);

        // Execute the job - should not throw exception (early return)
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
        $job = new CheckSchedulerScaleJob($mockService);

        // Execute the job - should rethrow the exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Service unavailable');

        $job->handle();
    }

    public function test_various_capacity_scenarios(): void
    {
        $testCases = [
            // [running, active, maxInstances, shouldProceed, shouldThrowMaxError, description]
            [4, 1, 10, true, false, '4 running, 1 active, max 10 - should proceed (difference = 3)'],
            [3, 1, 10, true, false, '3 running, 1 active, max 10 - should proceed (difference = 2)'],
            [2, 1, 10, false, false, '2 running, 1 active, max 10 - should scale up (difference = 1)'],
            [1, 0, 10, false, false, '1 running, 0 active, max 10 - should scale up (difference = 1)'],
            [10, 5, 10, false, true, '10 running, 5 active, max 10 - should throw max error'],
            [8, 3, 10, true, false, '8 running, 3 active, max 10 - should proceed (difference = 5)'],
        ];

        foreach ($testCases as [$running, $active, $maxInstances, $shouldProceed, $shouldThrowMaxError, $description]) {
            $mockService = Mockery::mock(SchedulerScaleService::class);

            $mockService->shouldReceive('getStatus')
                ->once()
                ->andReturn([
                    'success'     => true,
                    'environment' => 'staging',
                    'timestamp'   => '2025-09-23T05:49:29.627Z',
                    'ecs'         => [
                        'desired'     => $running,
                        'running'     => $running,
                        'pending'     => 0,
                        'serviceName' => 'meet-bot-staging',
                        'clusterName' => 'primary-staging',
                        'status'      => 'ACTIVE',
                    ],
                    'meetings' => [
                        'active' => $active,
                        'total'  => 1205,
                    ],
                    'capacity' => [
                        'maxInstances'          => $maxInstances,
                        'utilizationPercentage' => ($running / $maxInstances) * 100,
                    ],
                ]);

            if ($shouldProceed) {
                $mockService->shouldNotReceive('triggerScale');
            } elseif ($shouldThrowMaxError) {
                $mockService->shouldNotReceive('triggerScale');
            } else {
                $mockService->shouldReceive('triggerScale')
                    ->once()
                    ->with('up', config('app.env'))
                    ->andReturn(['success' => true]);
            }

            // Create job instance with mocked service
            $job = new CheckSchedulerScaleJob($mockService);

            if ($shouldProceed) {
                // Should not throw exception
                $job->handle();
                $this->assertTrue(true, $description);
            } elseif ($shouldThrowMaxError) {
                // Should throw max instances error
                $this->expectException(\Exception::class);
                $this->expectExceptionMessage('bots all used up. please try again later');
                $job->handle();
            } else {
                // Should throw scaling up error
                $this->expectException(\Exception::class);
                $this->expectExceptionMessage('bot is currenly scaling up. please try again later');
                $job->handle();
            }
        }
    }
}
