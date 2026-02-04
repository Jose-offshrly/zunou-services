<?php

namespace App\Actions\Background;

use App\DataTransferObjects\BackgroundData;
use App\Models\Background;
use Illuminate\Support\Facades\DB;

class CreateBackgroundAction
{
    public function handle(BackgroundData $data): Background
    {
        return DB::transaction(function () use ($data) {
            // Set all other background records for the user to inactive
            Background::query()
                ->where('user_id', $data->user_id)
                ->where('organization_id', $data->organization_id)
                ->update([
                    'active' => false,
                ]);

            $background = Background::create([
                'active'          => $data->active,
                'user_id'         => $data->user_id,
                'organization_id' => $data->organization_id,
            ]);

            if (isset($data->file->file_key)) {
                $background->fileKey = $data->file->file_key;
            }

            if (isset($data->file->file_name)) {
                $background->fileName = $data->file->file_name;
            }

            $background->save();

            return $background->refresh();
        });
    }
}
