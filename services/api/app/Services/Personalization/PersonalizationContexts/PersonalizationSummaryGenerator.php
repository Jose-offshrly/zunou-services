<?php

namespace App\Services\Personalization\PersonalizationContexts;

use App\Models\PersonalizationContext;
use App\Models\PersonalizationSummary;
use App\Models\User;
use App\Services\Personalization\OpenAIPersonalizationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PersonalizationSummaryGenerator implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected User $user, protected $contexts = null)
    {
    }

    public function handle(OpenAIPersonalizationService $openAIService)
    {
        $contexts = $this->contexts ?? PersonalizationContext::where('user_id', $this->user->id)
            ->where('expires_at', '>', now())
            ->get()
            ->groupBy('pulse_id');

        if ($contexts->isEmpty()) {
            return '';
        }

        foreach ($contexts as $pulseId => $pulseContexts) {
            $contextData = $pulseContexts->map(function ($context) {
                return "Category: {$context->category}\nContext: {$context->context}";
            })->implode("\n\n");

            $systemPrompt = "You are a personalization assistant that creates concise summaries of user activity and mentions.

Given multiple personalization contexts for {$this->user->name}, create a brief, actionable summary that highlights:
• Key mentions and actions needed
• Important updates or messages
• Priority items requiring attention

Keep the summary conversational and focused on what {$this->user->name} should know or do next.";

            $summary = $openAIService->createPersonalizationCompletion(
                $systemPrompt,
                $contextData
            );

            PersonalizationSummary::updateOrCreate(
                [
                    'user_id' => $this->user->id,
                    'pulse_id' => $pulseId,
                ],
                ['summary' => $summary]
            );
        }
    }
}