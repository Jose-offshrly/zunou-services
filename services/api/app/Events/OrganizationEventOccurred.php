<?php

namespace App\Events;

use App\Models\Organization;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrganizationEventOccurred
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public Organization $organization;
    public string $description;

    /**
     * Create a new event instance.
     *
     * @param  Organization  $organization
     * @param  string  $description
     * @return void
     */
    public function __construct(Organization $organization, string $description)
    {
        $this->organization = $organization;
        $this->description  = $description;
    }
}
