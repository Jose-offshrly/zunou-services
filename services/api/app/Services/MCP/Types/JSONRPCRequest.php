<?php

namespace App\Services\MCP\Types;

/**
 * Represents a JSON-RPC request message
 */
class JSONRPCRequest extends JSONRPCMessage
{
    /**
     * The method to call
     */
    protected string $method;

    /**
     * The parameters for the method call
     */
    protected ?array $params = null;

    /**
     * Create a new JSON-RPC request
     */
    public function __construct(string $method = '', ?array $params = null, ?string $id = null)
    {
        $this->method = $method;
        $this->params = $params;
        $this->id = $id;
    }

    /**
     * Get the method name
     */
    public function getMethod(): string
    {
        return $this->method;
    }

    /**
     * Set the method name
     */
    public function setMethod(string $method): self
    {
        $this->method = $method;
        return $this;
    }

    /**
     * Get the parameters
     */
    public function getParams(): ?array
    {
        return $this->params;
    }

    /**
     * Set the parameters
     */
    public function setParams(?array $params): self
    {
        $this->params = $params;
        return $this;
    }

    /**
     * Convert the request to an array
     */
    public function toArray(): array
    {
        $data = parent::toArray();
        $data['method'] = $this->method;
        if ($this->params !== null) {
            $data['params'] = $this->params;
        }
        return $data;
    }

    /**
     * Create a request from an array
     */
    public static function fromArray(array $data): self
    {
        $request = new static();
        
        if (isset($data['id'])) {
            $request->setId($data['id']);
        }
        
        if (isset($data['method'])) {
            $request->setMethod($data['method']);
        }
        
        if (isset($data['params'])) {
            $request->setParams($data['params']);
        }
        
        return $request;
    }
}
