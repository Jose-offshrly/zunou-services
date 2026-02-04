<?php

namespace App\Actions\TeamMessage;

use App\Events\TeamMessageDeleted;
use App\Models\TeamMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeleteTeamMessageAction
{
    public function handle(TeamMessage $teamMessage): bool
    {
        try {
            $teamMessage = TeamMessage::findOrFail($teamMessage->id);
            if (Auth::id() !== $teamMessage->user_id) {
                throw new \Exception(
                    'You do not have permission to delete this message',
                );
            }

            return DB::transaction(function () use ($teamMessage) {
                if ($teamMessage->is_parent_reply) {
                    TeamMessage::where(
                        'reply_team_thread_id',
                        $teamMessage->reply_team_thread_id,
                    )->delete();
                    return true;
                }

                $result = $teamMessage->delete();
                if ($result) {
                    TeamMessageDeleted::dispatch($teamMessage);
                }
                return $result;
            });
        } catch (\Exception $e) {
            Log::error('Failed to delete team message', [
                'teamMessageId' => $teamMessage->id,
                'error'         => $e->getMessage(),
            ]);

            return false;
        }
    }
}
