<?php

namespace App\Actions;

use App\DataTransferObjects\InterestData;
use App\Mail\InterestReceivedMail;
use App\Mail\InterestSentMail;
use App\Models\Interest;
use Illuminate\Support\Facades\Mail;

class CreateInterestAction
{
    public function handle(InterestData $data): Interest
    {
        $interest = Interest::create([
            'name'         => $data->name,
            'email'        => $data->email,
            'company_name' => $data->company_name,
            'company_size' => $data->company_size,
            'looking_for'  => $data->looking_for,
        ]);

        Mail::to($data->email)->send(new InterestSentMail(data: $data));
        Mail::to(config('zunou.interest.mail'))->send(new InterestReceivedMail(data: $data));

        return $interest->refresh();
    }
}
