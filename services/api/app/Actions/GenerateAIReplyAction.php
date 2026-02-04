<?php

namespace App\Actions;

use App\Events\ReplyGenerationStarted;
use App\Models\TeamMessage;
use App\Models\User;

class GenerateAIReplyAction
{
    public static function execute(TeamMessage $teamMessage, User $user)
    {
        ReplyGenerationStarted::dispatch($teamMessage, $user);
    }
}
