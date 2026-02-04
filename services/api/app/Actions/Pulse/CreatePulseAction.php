<?php

declare(strict_types=1);

namespace App\Actions\Pulse;

use App\DataTransferObjects\Pulse\PulseData;
use App\Enums\PulseMemberRole;
use App\GraphQL\Mutations\CreatePulseMemberMutation;
use App\Jobs\NewPulseSeedGettingStartedJob;
use App\Jobs\NewPulseSeedToVectorDB;
use App\Models\MasterPulse;
use App\Models\Organization;
use App\Models\Pulse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class CreatePulseAction
{
    public function __construct(
        private readonly CreatePulseMemberMutation $pulseMemberMutation,
        private MasterPulse $masterPulse,
    ) {
    }

    public function handle(PulseData $data): Pulse
    {
        return DB::transaction(function () use ($data) {
            $userId       = $data->userId ?? Auth::id();
            $organization = Organization::findOrFail($data->organizationId);
            Log::info("Organization found: {$organization->id}");

            if (isset($data->masterPulseId)) {
                // Find a live MasterPulse by ID
                $this->masterPulse = MasterPulse::where(
                    'id',
                    $data->masterPulseId,
                )
                    ->where('status', 'live')
                    ->first();
            }

            // Create a new Pulse for the organization
            $pulse = Pulse::create([
                'id'              => (string) Str::uuid(), // Explicit UUID generation
                'organization_id' => $organization->id,
                'name'            => $data->name                      ?? $this->masterPulse->name,
                'type'            => $this->masterPulse->type         ?? 'generic',
                'description'     => $data->description        ?? $this->masterPulse->description,
                'features'        => $this->masterPulse->features ?? null,
                'icon'            => $data->icon                      ?? 'generic',
                'category'        => $data->category              ?? null,
                'status'          => 'ACTIVE',
            ]);

            // Automatically create pulse member for the owner
            $this->pulseMemberMutation->__invoke(null, [
                'pulseId' => $pulse->id,
                'input'   => [
                    [
                        'role'   => PulseMemberRole::OWNER->value,
                        'userId' => $userId,
                    ],
                ],
            ]);

            if ($pulse->type !== 'generic' || $pulse->type !== 'mcp') {
                // Dispatch the data seeding job
                NewPulseSeedToVectorDB::dispatch($organization->id, $pulse->id);
                Log::info(
                    "Seeding job dispatched for organization {$organization->id} and pulse {$pulse->id}",
                );

                // Dispatch the SeedGettingStartedJob asynchronously
                NewPulseSeedGettingStartedJob::dispatch(
                    $organization->id,
                    $pulse->id,
                );
                Log::info(
                    "SeedGettingStartedJob dispatched for organization {$organization->id} and pulse {$pulse->id}",
                );
            }

            return $pulse;
        });
    }
}
