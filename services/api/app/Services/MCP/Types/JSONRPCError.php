<?php

namespace App\Services\MCP\Types;

/**
 * Represents a JSON-RPC error
 */
class JSONRPCError
{
    /**
     * Standard JSON-RPC error codes
     */
    public const PARSE_ERROR = -32700;
    public const INVALID_REQUEST = -32600;
    public const METHOD_NOT_FOUND = -32601;
    public const INVALID_PARAMS = -32602;
    public const INTERNAL_ERROR = -32603;
    
    /**
     * MCP specific error codes
     */
    public const SERVER_NOT_INITIALIZED = -32002;
    public const UNKNOWN_CAPABILITY = -32001;
    public const CONTENT_MODIFIED = -32000;
    public const REQUEST_FAILED = -32999;
    public const REQUEST_CANCELLED = -32998;
    
    /**
     * The error code
     */
    protected int $code;
    
    /**
     * The error message
     */
    protected string $message;
    
    /**
     * Additional error data
     */
    protected $data = null;
    
    /**
     * Create a new JSON-RPC error
     */
    public function __construct(int $code, string $message, $data = null)
    {
        $this->code = $code;
        $this->message = $message;
        $this->data = $data;
    }
    
    /**
     * Get the error code
     */
    public function getCode(): int
    {
        return $this->code;
    }
    
    /**
     * Set the error code
     */
    public function setCode(int $code): self
    {
        $this->code = $code;
        return $this;
    }
    
    /**
     * Get the error message
     */
    public function getMessage(): string
    {
        return $this->message;
    }
    
    /**
     * Set the error message
     */
    public function setMessage(string $message): self
    {
        $this->message = $message;
        return $this;
    }
    
    /**
     * Get the error data
     */
    public function getData()
    {
        return $this->data;
    }
    
    /**
     * Set the error data
     */
    public function setData($data): self
    {
        $this->data = $data;
        return $this;
    }
    
    /**
     * Convert the error to an array
     */
    public function toArray(): array
    {
        $data = [
            'code' => $this->code,
            'message' => $this->message,
        ];
        
        if ($this->data !== null) {
            $data['data'] = $this->data;
        }
        
        return $data;
    }
    
    /**
     * Create an error from an array
     */
    public static function fromArray(array $data): self
    {
        $code = $data['code'] ?? self::INTERNAL_ERROR;
        $message = $data['message'] ?? 'Unknown error';
        $errorData = $data['data'] ?? null;
        
        return new self($code, $message, $errorData);
    }
}
