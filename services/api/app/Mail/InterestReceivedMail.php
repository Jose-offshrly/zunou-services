<?php

namespace App\Mail;

use App\DataTransferObjects\InterestData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterestReceivedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public InterestData $data)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Interest Received',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.interests.received',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
