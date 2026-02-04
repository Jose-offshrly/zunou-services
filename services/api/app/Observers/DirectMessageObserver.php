<?php

namespace App\Observers;

use App\Concerns\FeedHandler;
use App\Enums\FeedType;
use App\Models\DirectMessage;

class DirectMessageObserver
{
    use FeedHandler;

    public function created(DirectMessage $directMessage): void
    {
        $participants = $directMessage->thread->participants;

        $filteredParticipants = array_values(
            array_filter($participants, function ($id) use ($directMessage) {
                return $id !== $directMessage->sender_id;
            }),
        );

        foreach ($filteredParticipants as $participant) {
            $this->recordActivity(
                model: $directMessage,
                properties: [
                    'data'   => $directMessage->toArray(),
                    'causer' => $directMessage->sender->only([
                        'id',
                        'name',
                        'email',
                        'gravatar',
                    ]),
                ],
                description: 'New DM from ' . $directMessage->sender->name,
                feed_type: FeedType::DIRECTMESSAGE->value,
                organization_id: $directMessage->thread->organization_id,
                receiver_id: $participant,
            );
        }
    }
}
