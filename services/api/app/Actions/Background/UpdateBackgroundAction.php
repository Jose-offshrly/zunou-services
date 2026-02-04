<?php

namespace App\Actions\Background;

use App\DataTransferObjects\UpdateBackgroundData;
use App\Models\Background;

class UpdateBackgroundAction
{
    public function handle(
        Background $background,
        UpdateBackgroundData $data,
    ): Background {
        Background::where('user_id', $background->user_id)
            ->where('organization_id', $background->organization_id)
            ->where('id', '!=', $background->id)
            ->update(['active' => false]);

        $background->update([
            'active' => $data->active,
        ]);

        return $background->refresh();
    }
}
