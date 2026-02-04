<?php

namespace App\Services\Pipelines\Contracts;

/**
 * Interface for pipeline steps.
 * 
 * Each step is a self-contained unit of work that processes context
 * and returns updated context for the next step.
 * 
 * Steps work with DTOs or objects, ensuring type safety and alignment.
 */
interface PipelineStepInterface
{
    /**
     * Execute the step and return updated context.
     *
     * @param mixed $context The current pipeline context (DTO or object)
     * @return mixed Updated context to pass to next step (same type)
     * 
     * Note: Implementations should use specific type hints for their context type
     * (e.g., `handle(MeetingSummaryContext $ctx): MeetingSummaryContext`)
     * 
     * @throws \Throwable If step fails, exception will be caught by pipeline
     */
    public function handle($context);

    /**
     * Get the step name for logging and debugging.
     *
     * @return string
     */
    public function getName(): string;
}

