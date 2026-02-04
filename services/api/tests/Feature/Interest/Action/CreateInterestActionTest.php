<?php

namespace Feature\Interest\Action;

use App\Actions\CreateInterestAction;
use App\DataTransferObjects\InterestData;
use App\Mail\InterestReceivedMail;
use App\Mail\InterestSentMail;
use App\Models\Interest;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CreateInterestActionTest extends TestCase
{
    public function test_it_can_create_an_interest()
    {
        Mail::fake();

        $data = new InterestData(
            name: 'Interest Name',
            email: 'email@email.com',
            company_name: 'Company Name',
            company_size: '1-10 Employees',
            looking_for: 'looking for content',
        );

        $action = app(CreateInterestAction::class);

        $interest = $action->handle($data);

        $this->assertInstanceOf(Interest::class, $interest);
        Mail::assertQueued(InterestReceivedMail::class);
        Mail::assertQueued(InterestSentMail::class);
        Mail::assertQueuedCount(2);
    }

    public function test_it_can_create_an_interest_with_null_looking_for()
    {
        Mail::fake();

        $data = new InterestData(
            name: 'Interest Name',
            email: 'email2@email.com',
            company_name: 'Company Name',
            company_size: '1-10 Employees',
            looking_for: null,
        );

        $action = app(CreateInterestAction::class);

        $interest = $action->handle($data);

        $this->assertInstanceOf(Interest::class, $interest);
        $this->assertNull($interest->looking_for);
        Mail::assertQueued(InterestReceivedMail::class);
        Mail::assertQueued(InterestSentMail::class);
        Mail::assertQueuedCount(2);
    }
}
