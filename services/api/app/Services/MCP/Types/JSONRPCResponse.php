<?php

namespace App\Services\MCP\Types;

/**
 * Represents a JSON-RPC response message
 */
class JSONRPCResponse extends JSONRPCMessage
{
    /**
     * The result of the request (for successful responses)
     */
    protected $result = null;

    /**
     * The error information (for error responses)
     */
    protected ?JSONRPCError $error = null;

    /**
     * Create a new JSON-RPC response
     */
    public function __construct($result = null, ?JSONRPCError $error = null, ?string $id = null)
    {
        $this->result = $result;
        $this->error = $error;
        $this->id = $id;
    }

    /**
     * Get the result
     */
    public function getResult()
    {
        return $this->result;
    }

    /**
     * Set the result
     */
    public function setResult($result): self
    {
        $this->result = $result;
        $this->error = null; // A response can't have both result and error
        return $this;
    }

    /**
     * Get the error
     */
    public function getError(): ?JSONRPCError
    {
        return $this->error;
    }

    /**
     * Set the error
     */
    public function setError(?JSONRPCError $error): self
    {
        $this->error = $error;
        $this->result = null; // A response can't have both result and error
        return $this;
    }

    /**
     * Check if the response is an error
     */
    public function isError(): bool
    {
        return $this->error !== null;
    }

    /**
     * Convert the response to an array
     */
    public function toArray(): array
    {
        $data = parent::toArray();
        
        if ($this->error !== null) {
            $data['error'] = $this->error->toArray();
        } else {
            $data['result'] = $this->result;
        }
        
        return $data;
    }

    /**
     * Create a response from an array
     */
    public static function fromArray(array $data): self
    {
        $response = new static();
        
        if (isset($data['id'])) {
            $response->setId($data['id']);
        }
        
        if (isset($data['error'])) {
            $error = JSONRPCError::fromArray($data['error']);
            $response->setError($error);
        } elseif (isset($data['result'])) {
            $response->setResult($data['result']);
        }
        
        return $response;
    }
}
