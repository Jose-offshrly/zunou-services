<?php

namespace App\Services\Routing\Contracts;

use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Interface for request processing pipelines.
 * 
 * Pipelines provide optimized, direct paths for specific operations
 * instead of going through the full agentic workflow.
 * 
 * The RequestRouter uses LLM-based classification to identify which pipeline
 * should handle a request, so pipelines only need to implement execute().
 */
interface PipelineInterface
{
    /**
     * Execute the pipeline and return the response.
     *
     * @param Collection $messages The conversation messages (already processed)
     * @param Thread $thread The thread context
     * @param User $user The user making the request
     * @param string $message The current message being processed
     * @return string|null The pipeline response, or null to fallback to agentic workflow
     * 
     * @throws \Throwable If execution fails, the router will fallback to agentic workflow
     */
    public function execute(
        Collection $messages,
        Thread $thread,
        User $user,
        string $message,
    ): ?string;
}

