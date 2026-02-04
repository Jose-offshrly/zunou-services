<?php

namespace App\Services;

use App\Models\Message;
use App\Models\SystemMessage;
use App\Models\SystemThread;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\SubAgents\BaseSubAgent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RunStandAloneAgent
{
    public User $user;
    public string $organizationId;
    public string $pulseId;
    public Thread $thread;

    public function __construct(
        string $pulseId,
        string $organizationId,
        string $userId,
    ) {
        $this->user           = User::find($userId);
        $this->organizationId = $organizationId;
        $this->pulseId        = $pulseId;
    }

    public function run(Collection $messages, ?string $threadType = null, ?array $responseSchema = null, ?BaseSubAgent $subagent = null)
    {
        try {
            $this->createTempThread($threadType);

            // temporary message ID for the action, not really used in the code other than filtering messages
            $tempMessageId = '7fce0321-a18c-4597-bb26-af420e4c2017';

            if ($subagent) {
                $agent = $subagent;
            } else {
                $agent = app(AgentService::class)->getAgent(
                    $this->thread->pulse,
                    $this->thread->type,
                );
            }
            
            $response = $agent->processMessage($messages, $this->thread, $this->user, $tempMessageId, $responseSchema);

            if ($responseSchema) {
                return $response;
            }

            if (is_string($response) && $responseSchema) {
                $decoded = json_decode($response, true);

                if (
                    json_last_error() === JSON_ERROR_NONE && is_array($decoded)
                ) {
                    if (array_key_exists('message', $decoded)) {
                        return $decoded['message'];
                    }

                    if (array_key_exists('summary', $decoded)) {
                        return $decoded['summary'];
                    }

                    return $response;
                }
            }

            return $response;
        } catch (\Throwable $th) {
            Log::error('Standalone agent failed', [
                'error' => $th->getMessage(),
            ]);
            throw $th;
        } finally {
            $this->cleanup();
        }
    }

    private function createTempThread(?string $threadType = null)
    {
        $id     = Str::uuid()->toString();
        $thread = Thread::create(
            [
                'id'              => $id,
                'name'            => 'Temporary Thread',
                'organization_id' => $this->organizationId,
                'user_id'         => $this->user->id,
                'type'            => $threadType ?? 'admin',
                'pulse_id'        => $this->pulseId,
                'third_party_id'  => $id,
                'is_active'       => false,
            ],
        );

        $this->thread = $thread;
    }

    private function cleanup()
    {
        if (isset($this->thread) && $this->thread instanceof Thread) {
            Message::where('thread_id', $this->thread->id)->delete();

            $systemThread = SystemThread::where(
                'parent_thread_id',
                $this->thread->id,
            )->first();

            if ($systemThread) {
                $systemMessages = SystemMessage::where(
                    'system_thread_id',
                    $systemThread->id,
                )->get();
                if ($systemMessages->count() > 0) {
                    $systemMessages = SystemMessage::where(
                        'system_thread_id',
                        $systemThread->id,
                    )->delete();
                }
                $systemThread->delete();
            }

            $this->thread->delete();
        }
    }
}
