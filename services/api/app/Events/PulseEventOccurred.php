<?php

namespace App\Events;

use App\Models\Pulse;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PulseEventOccurred
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public Pulse $pulse;
    public string $description;

    /**
     * Create a new event instance.
     *
     * @param  Pulse  $pulse
     * @param  string  $description
     * @return void
     */
    public function __construct(Pulse $pulse, string $description)
    {
        $this->pulse       = $pulse;
        $this->description = $description;
    }
}
