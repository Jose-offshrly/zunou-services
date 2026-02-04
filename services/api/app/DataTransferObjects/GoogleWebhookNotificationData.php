<?php

namespace App\DataTransferObjects;

use Illuminate\Http\Request;

class GoogleWebhookNotificationData
{
    public function __construct(
        public readonly ?string $channelId,
        public readonly ?string $token,
        public readonly ?string $resourceId,
        public readonly ?string $resourceUri,
        public readonly ?string $resourceState,
        public readonly array $body,
        public readonly ?string $prevSyncToken,
    ) {
    }

    public static function fromRequest(Request $request, ?string $prevSyncToken = null): self
    {
        $channelId     = $request->header('X-Goog-Channel-ID');
        $channelToken  = $request->header('X-Goog-Channel-Token');
        $resourceId    = $request->header('X-Goog-Resource-ID');
        $resourceUri   = $request->header('X-Goog-Resource-URI');
        $resourceState = $request->header('X-Goog-Resource-State');

        $body = [];
        if ($request->getContent()) {
            $parsed = json_decode($request->getContent(), true);
            if (is_array($parsed)) {
                $body = $parsed;
            }
        }

        return new self(
            channelId: $channelId,
            token: $channelToken,
            resourceId: $resourceId,
            resourceUri: $resourceUri,
            resourceState: $resourceState,
            body: $body,
            prevSyncToken: $prevSyncToken,
        );
    }

    public function toServicePayload(): array
    {
        return [
            'channelId'     => $this->channelId,
            'token'         => $this->token,
            'resourceId'    => $this->resourceId,
            'resourceUri'   => $this->resourceUri,
            'resourceState' => $this->resourceState,
            'prevSyncToken' => $this->prevSyncToken,
        ] + $this->body;
    }
}


