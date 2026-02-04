<?php declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\DirectMessage;

final readonly class PinDirectMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $directMessage = DirectMessage::findOrFail($args['directMessageId']);
        $directMessage->update(['is_pinned' => $args['pinned']]);
        return $directMessage;
    }
}
