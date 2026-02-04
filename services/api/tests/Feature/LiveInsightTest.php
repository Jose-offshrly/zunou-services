<?php

namespace Tests\Feature;

use App\Jobs\InsightRecommendationGeneratorJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class LiveInsightTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_example(): void
    {
        dispatch_sync(new InsightRecommendationGeneratorJob(219));
    }
}
