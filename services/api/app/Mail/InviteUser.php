<?php

namespace App\Mail;

use App\Models\OrganizationUser;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;

class InviteUser extends Mailable
{
    use Queueable;
    use SerializesModels;

    private string $baseUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public OrganizationUser $organizationUser,
        public bool $existing = false,
    ) {
        $this->baseUrl = Config::get('zunou.dashboard.base_url');
    }

    private function generateInviteUrl(): string
    {
        return sprintf(
            '%s/organizations/%s/invites/%s',
            $this->baseUrl,
            $this->organizationUser->organization_id,
            $this->organizationUser->invite_code,
        );
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
            view: 'mail.users.invited',
            text: 'mail.users.invited-text',
            with: [
                'inviteCode'       => $this->organizationUser->invite_code,
                'inviteUrl'        => $this->generateInviteUrl(),
                'userName'         => $this->organizationUser->user->name,
                'organizationName' => $this->organizationUser->organization->name,
                'existing'         => $this->existing,
                'appUrl'           => $this->baseUrl.'/organizations/'.$this->organizationUser->organization_id,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
