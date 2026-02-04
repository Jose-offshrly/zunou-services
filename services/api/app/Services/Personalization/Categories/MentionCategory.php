<?php

namespace App\Services\Personalization\Categories;

use App\Models\Pulse;
use App\Models\User;
use App\Services\Personalization\Categories\Category;
use App\Services\Personalization\OpenAIPersonalizationService;
use App\Services\Personalization\Traits\UserLookupUtilities;
use Illuminate\Support\Facades\Log;

class MentionCategory extends Category
{
    use UserLookupUtilities;
    
    public const NAME = 'mention';

    public function __construct(
        protected OpenAIPersonalizationService $openAIService,
        protected Pulse $pulse
    ) {
    }

    public function apply(): void
    {
        $this->updatePersonalizationSourceTimestamp();

        if (! $this->isValid()) { // Here we validate that the content relates to category, we should not call AI at this stage. 
            return;
        }

        $senderUser = $this->personalizationSource->source->user;
        $mentionedUsers = $this->getMentionedUsers();
        
        foreach($mentionedUsers as $mentionedUser) {
            $this->createMentionContext($mentionedUser, $senderUser, $this->content);
        }
    }
        
    protected function getMentionedUsers(): array
    {
        preg_match_all('/<span[^>]*>@([^<]+)<\/span>/', $this->content, $matches);

        $usernames = array_unique($matches[1] ?? []);

        return array_values(array_filter(array_map(
            fn($name) => $this->findUserByName($name, $this->pulse),
            $usernames
        )));
    }

    private function isValid(): bool
    {
        return preg_match('/<span[^>]*>@([^<]+)<\/span>/', $this->content) === 1;
    }

    protected function createMentionContext(User $mentionedUser, User $senderUser, string $message): void
    {
        $senderName =  $senderUser->name;
        $mentionedName = $mentionedUser->name;
        
        $systemPrompt = "You are a personalization assistant that creates summaries for user activity feeds.
Given a message where {$mentionedName} was mentioned by {$senderName}, create a natural summary and determine how many days this mention should remain relevant.

For the summary:
• Clearly states who mentioned {$mentionedName}
• Summarizes what {$mentionedName} needs to know or do
• Is conversational and suitable for a personalized feed
• Limits to 2-3 sentences maximum

For expiration_days (1-30):
• If explicit dates/times are mentioned (tomorrow, next week, Friday, etc.), calculate days until that date
• 'Tomorrow' or 'today' = 1 day
• 'This week' or specific weekday = days until that date
• 'Next week' = 7-10 days
• 'Next month' = 30 days
• Otherwise use context: Urgent (1-3), Regular tasks (3-7), General mentions (7-14), Long-term (14-30)";

        try {
            if (! $this->isRelatedToJob($mentionedUser, $message, $systemPrompt)) {
                return;
            }
            
            $response = $this->openAIService->createPersonalizationCompletion(
                $systemPrompt,
                $message,
                $this->getResponseSchema()
            );
            
            $this->createPersonalizationContext(
                $mentionedUser, 
                trim($response['summary']), 
                $response['expiration_days'],
                $this->pulse,
            );
            
        } catch (\Exception $e) {
            Log::error('Failed to generate mention context', [
                'error' => $e->getMessage(),
                'mentioned_user' => $mentionedUser->id,
                'sender_user' => $senderUser?->id,
            ]);
        }
    }

    protected function isRelatedToJob(User $user, string $message): bool
    {
        $jobDescription  = $this->findUserJobDescription($user->id, $this->pulse) ?? '';
        $responsibilities = $this->findUserResponsibilities($user->id, $this->pulse) ?? [];

        $hasJobContext = $jobDescription || ! empty($responsibilities);

        if (! $hasJobContext) {
            return false;
        }

        $jobValidationPrompt = "Check the contact if aligned with the user's job description and responsibilities.";

        if ($jobDescription) {
            $message .= "\n\nUser's job description: {$jobDescription}";
        }
        if ($responsibilities) {
            $message .= "\n\nUser's responsibilities: " . implode(', ', $responsibilities);
        }

        $validationResponse = $this->openAIService->createPersonalizationCompletion(
            $jobValidationPrompt,
            $message,
            [
                'type' => 'json_schema',
                'json_schema' => [
                    'name'   => 'job_validation',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            'fits_job' => ['type' => 'boolean']
                        ],
                        'required' => ['fits_job'],
                        'additionalProperties' => false
                    ],
                    'strict' => true
                ]
            ]
        );

        return $validationResponse['fits_job'];
    }
    
    protected function getResponseSchema(): array
    {
        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'mention_context',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'summary' => [
                            'type' => 'string',
                            'description' => 'Natural summary of the mention for the activity feed'
                        ],
                        'expiration_days' => [
                            'type' => 'integer',
                            'minimum' => 1,
                            'description' => 'Number of days this mention should remain relevant'
                        ]
                    ],
                    'required' => ['summary', 'expiration_days'],
                    'additionalProperties' => false
                ],
                'strict' => true
            ]
        ];
    }
}