<?php

namespace Tests\Unit\Meeting\Facade;

use App\Facades\MeetingFacade as Meeting;
use Tests\TestCase;

class MeetingFacadeTest extends TestCase
{
    public function test_it_returns_a_manual_meeting_creator()
    {
        $facade = new Meeting();

        $this->assertEquals('manual', $facade::getDriver());
    }
}
