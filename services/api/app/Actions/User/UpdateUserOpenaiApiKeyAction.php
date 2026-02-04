<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Models\User;

final class UpdateUserOpenaiApiKeyAction
{
    public function handle(User $user, ?string $openaiApiKey): User
    {
        $user->update([
            'openai_api_key' => $openaiApiKey,
        ]);

        $user->save();

        return $user->refresh();
    }
}
