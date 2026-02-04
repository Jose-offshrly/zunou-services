<?php

namespace App\Services\MCP\Types;

/**
 * Base class for JSON-RPC messages
 */
class JSONRPCMessage
{
    /**
     * The JSON-RPC version (always "2.0")
     */
    protected string $jsonrpc = "2.0";

    /**
     * Message ID for requests/responses (null for notifications)
     */
    protected ?string $id = null;

    /**
     * Get the JSON-RPC version
     */
    public function getJsonrpc(): string
    {
        return $this->jsonrpc;
    }

    /**
     * Get the message ID
     */
    public function getId(): ?string
    {
        return $this->id;
    }

    /**
     * Set the message ID
     */
    public function setId(?string $id): self
    {
        $this->id = $id;
        return $this;
    }

    /**
     * Convert the message to an array
     */
    public function toArray(): array
    {
        $data = [
            'jsonrpc' => $this->jsonrpc,
        ];
        
        // Only include id if it's not null (for notifications, id should be omitted)
        if ($this->id !== null) {
            $data['id'] = $this->id;
        }
        
        return $data;
    }

    /**
     * Create a message from an array
     */
    public static function fromArray(array $data): self
    {
        $message = new static();
        if (isset($data['id'])) {
            $message->setId($data['id']);
        }
        return $message;
    }
}
