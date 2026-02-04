<?php

namespace App\Mail;

use App\Models\OrganizationUser;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

class InviteExistingUserMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    private string $baseUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public OrganizationUser $organizationUser,
    ) {
        $this->baseUrl = Config::get('zunou.dashboard.base_url');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You have been invited to join Zunou.ai');
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.users.invite-existing-user-mail',
            with: [
                'userName'         => $this->organizationUser->user->name,
                'organizationName' => $this->organizationUser->organization->name,
                'userRole'         => Str::title(value: $this->organizationUser->role),
                'appUrl'           => $this->baseUrl.'/organizations/'.$this->organizationUser->organization_id,
            ],
        );
    }

}
