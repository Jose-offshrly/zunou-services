<?php

namespace App\Services\MCP\Transport;

/**
 * Interface for MCP transports
 */
interface TransportInterface
{
    /**
     * Connect to the transport
     *
     * @return bool True if connected successfully
     * @throws \Exception If connection fails
     */
    public function connect(): bool;
    
    /**
     * Disconnect from the transport
     *
     * @return bool True if disconnected successfully
     */
    public function disconnect(): bool;
    
    /**
     * Send a message through the transport
     *
     * @param string $message The message to send
     * @return bool True if sent successfully
     * @throws \Exception If sending fails
     */
    public function send(string $message): bool;
    
    /**
     * Receive a message from the transport
     *
     * @param float|null $timeout Timeout in seconds (null for no timeout)
     * @return string|null The received message, or null if no message available
     * @throws \Exception If receiving fails
     */
    public function receive(?float $timeout = null): ?string;
    
    /**
     * Check if the transport is connected
     *
     * @return bool True if connected
     */
    public function isConnected(): bool;
    
    /**
     * Get the session ID
     *
     * @return string|null The session ID, or null if not set
     */
    public function getSessionId(): ?string;
    
    /**
     * Set the protocol version
     *
     * @param string $version The protocol version
     */
    public function setProtocolVersion(string $version): void;
    
    /**
     * Get the protocol version
     *
     * @return string|null The protocol version, or null if not set
     */
    public function getProtocolVersion(): ?string;
}
