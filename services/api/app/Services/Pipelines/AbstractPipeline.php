<?php

namespace App\Services\Pipelines;

use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\Pipelines\Contracts\PipelineStepInterface;
use App\Services\Routing\Contracts\PipelineInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

abstract class AbstractPipeline implements PipelineInterface
{
    protected array $steps = [];
    public $context;
    protected bool $logPerformance = true;
    public function execute(
        Collection $messages,
        Thread $thread,
        User $user,
        string $message,
    ): ?string {
        try {
            $this->initializeContext($messages, $thread, $user, $message);
            $this->validateContext();

            $pipelineStart = microtime(true);
            foreach ($this->steps as $index => $step) {
                $stepStart = microtime(true);
                
                try {
                    $this->context = $step->handle($this->context);
                    
                    $stepTime = microtime(true) - $stepStart;
                    if ($this->logPerformance) {
                        Log::info('[PERF] Pipeline Step', [
                            'step' => $step->getName(),
                            'step_number' => $index + 1,
                            'time' => round($stepTime, 3),
                        ]);
                    }

                    if ($this->shouldStopExecution()) {
                        break;
                    }
                } catch (\Throwable $e) {
                    Log::error('[Pipeline] Step execution failed', [
                        'step' => $step->getName(),
                        'step_number' => $index + 1,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    throw $e;
                }
            }

            $totalTime = microtime(true) - $pipelineStart;
            if ($this->logPerformance) {
                Log::info('[PERF] Pipeline Execution Complete', [
                    'total_steps' => count($this->steps),
                    'total_time' => round($totalTime, 3),
                ]);
            }

            if (is_object($this->context) && property_exists($this->context, 'result')) {
                return $this->context->result;
            }
            
            return "Something went wrong while processing the request";
        } catch (\Throwable $e) {
            Log::error('[Pipeline] Execution failed', [
                'pipeline' => class_basename(static::class),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return "Something went wrong while processing the request";
        }
    }

    abstract protected function initializeContext(
        Collection $messages,
        Thread $thread,
        User $user,
        string $message,
    ): void;

    protected function validateContext(): void
    {
        if (!is_object($this->context)) {
            throw new \InvalidArgumentException('Pipeline context must be an object');
        }

        $requiredFields = ['success', 'error', 'result'];
        $missingFields = [];

        foreach ($requiredFields as $field) {
            if (!property_exists($this->context, $field)) {
                $missingFields[] = $field;
            }
        }

        if (!empty($missingFields)) {
            throw new \InvalidArgumentException(
                'Pipeline context is missing required fields: ' . implode(', ', $missingFields)
            );
        }
    }

    protected function shouldStopExecution(): bool
    {
        if (is_object($this->context) && property_exists($this->context, 'success')) {
            return !$this->context->success;
        }
        
        return false;
    }

    public function setLogPerformance(bool $enabled): self
    {
        $this->logPerformance = $enabled;
        return $this;
    }

    public function getSteps(): array
    {
        return $this->steps;
    }
}

