<?php

namespace App\Jobs;

use App\Actions\FireFlies\FetchUserFireFliesDetailAction;
use App\Actions\FireFlies\FetchUserFireFliesTranscriptsAction;
use App\Actions\FireFlies\StoreUserFireFliesTranscriptionAction;
use App\DataTransferObjects\IntegrationData;
use App\Enums\SyncStatus;
use App\Events\FireFliesMeetingSynced;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessFireFliesMeetingsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected IntegrationData $data,
        protected User $user,
    ) {
    }

    public function handle(
        FetchUserFireFliesDetailAction $fetchUserFireFliesDetailAction,
        FetchUserFireFliesTranscriptsAction $fetchUserFireFliesTranscriptionAction,
        StoreUserFireFliesTranscriptionAction $storeUserFireFliesTranscriptionAction,
    ) {
        $integration = Integration::findByApiKey(
            $this->data->api_key,
            $this->user->id,
            $this->data->pulse_id,
        );

        \Log::info(
            'Integration initially fetched: '.
                json_encode($integration->toArray()),
        );

        if (! $integration) {
            \Log::error('No integration found for API Key', [
                'api_key'  => $this->data->api_key,
                'user_id'  => $this->user->id,
                'pulse_id' => $this->data->pulse_id,
            ]);

            return;
        }

        try {
            $fireFliesUser = $fetchUserFireFliesDetailAction->handle(
                api_key: $integration->api_key,
                user: $this->user,
            );

            $transcriptions = $fetchUserFireFliesTranscriptionAction->handle(
                api_key: $integration->api_key,
                fireFliesUser: $fireFliesUser,
            );

            $storeUserFireFliesTranscriptionAction->handle(
                transcriptions: $transcriptions,
                user: $this->user,
                pulseId: $this->data->pulse_id,
            );

            \Log::info(
                'Integration before the update: '.
                    json_encode($integration->toArray()),
            );

            $integration->update([
                'sync_status' => SyncStatus::DONE,
            ]);

            $integration->refresh();

            \Log::info(
                'Integration after update: '.
                    json_encode($integration->toArray()),
            );
        } catch (\Exception $e) {
            \Log::error(
                'Failed to process FireFlies meetings: '.$e->getMessage(),
            );

            $integration->update([
                'sync_status' => SyncStatus::FAILED,
            ]);
        } finally {
            FireFliesMeetingSynced::dispatch($this->data->pulse_id);
        }
    }
}
