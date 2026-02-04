<?php

declare(strict_types=1);

namespace App\Actions\User;

use App\Models\User;

final class UpdateUserAssemblyaiKeyAction
{
    public function handle(User $user, ?string $assemblyaiKey): User
    {
        $user->update([
            'assemblyai_key' => $assemblyaiKey,
        ]);

        $user->save();

        return $user->refresh();
    }
}
