<?php

declare(strict_types=1);

namespace Tests\Feature\Pulse\Actions;

use App\Actions\Pulse\CreatePulseAction;
use App\DataTransferObjects\Pulse\PulseData;
use App\Enums\PulseCategory;
use App\Models\MasterPulse;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Tests\TestCase;

class CreatePulseActionTest extends TestCase
{
    public function test_it_can_create_a_pulse(): void
    {
        /** @var Authenticatable $user */
        $user         = User::first();
        $organization = Organization::first();
        $masterPulse  = MasterPulse::first();
        $this->actingAs($user);

        $data = new PulseData(
            name: 'Pulse',
            masterPulseId: $masterPulse->id,
            organizationId: $organization->id,
            category: PulseCategory::ONETOONE->value,
        );

        $action = app(CreatePulseAction::class);

        $pulse = $action->handle(data: $data);

        $this->assertInstanceOf(Pulse::class, $pulse);
        $this->assertInstanceOf(Organization::class, $pulse->organization);
        $this->assertEquals('ONETOONE', PulseCategory::ONETOONE->value);
        $this->assertEquals('Pulse', $pulse->name);
        $this->assertEquals('hr', $pulse->type);
        $this->assertNotNull($pulse->description);
        $this->assertNotNull($pulse->features);
    }
}
