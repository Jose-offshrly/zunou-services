<?php

namespace App\Services\MCP\Transport;

use Illuminate\Support\Facades\Log;

/**
 * Stdio transport for MCP communication
 */
class StdioTransport implements TransportInterface
{
    /**
     * The command to execute
     */
    protected string $command;
    
    /**
     * The process resource
     */
    protected $process = null;
    
    /**
     * The process pipes
     */
    protected array $pipes = [];
    
    /**
     * Create a new Stdio transport
     *
     * @param string $command The command to execute
     */
    public function __construct(string $command)
    {
        $this->command = $command;
    }
    
    /**
     * Connect to the transport
     *
     * @return bool True if connected successfully
     * @throws \Exception If connection fails
     */
    public function connect(): bool
    {
        if ($this->isConnected()) {
            return true;
        }
        
        $descriptorSpec = [
            0 => ["pipe", "r"],  // stdin
            1 => ["pipe", "w"],  // stdout
            2 => ["pipe", "w"]   // stderr
        ];
        
        Log::info("Starting MCP Stdio process with command: {$this->command}");
        
        $this->process = proc_open($this->command, $descriptorSpec, $this->pipes);
        
        if (!is_resource($this->process)) {
            throw new \Exception("Failed to start process for command: {$this->command}");
        }
        
        // Set non-blocking mode for stdout and stderr
        stream_set_blocking($this->pipes[1], false);
        stream_set_blocking($this->pipes[2], false);
        
        return true;
    }
    
    /**
     * Disconnect from the transport
     *
     * @return bool True if disconnected successfully
     */
    public function disconnect(): bool
    {
        if (!$this->isConnected()) {
            return true;
        }
        
        // Close pipes
        foreach ($this->pipes as $pipe) {
            if (is_resource($pipe)) {
                fclose($pipe);
            }
        }
        
        // Terminate the process
        $status = proc_terminate($this->process);
        proc_close($this->process);
        
        $this->process = null;
        $this->pipes = [];
        
        return $status;
    }
    
    /**
     * Send a message through the transport
     *
     * @param string $message The message to send
     * @return bool True if sent successfully
     * @throws \Exception If sending fails
     */
    public function send(string $message): bool
    {
        if (!$this->isConnected()) {
            throw new \Exception("Cannot send message: transport not connected");
        }
        
        // Add a newline if not present
        if (substr($message, -1) !== "\n") {
            $message .= "\n";
        }
        
        $result = fwrite($this->pipes[0], $message);
        fflush($this->pipes[0]);
        
        if ($result === false) {
            throw new \Exception("Failed to write to process stdin");
        }
        
        return true;
    }
    
    /**
     * Receive a message from the transport
     *
     * @param float|null $timeout Timeout in seconds (null for no timeout)
     * @return string|null The received message, or null if no message available
     * @throws \Exception If receiving fails
     */
    public function receive(?float $timeout = null): ?string
    {
        if (!$this->isConnected()) {
            throw new \Exception("Cannot receive message: transport not connected");
        }
        
        // Check if process is still running
        $status = proc_get_status($this->process);
        if (!$status['running']) {
            $stderr = stream_get_contents($this->pipes[2]);
            throw new \Exception("Process has terminated: {$stderr}");
        }
        
        // If timeout is specified, wait for data to be available
        if ($timeout !== null) {
            $read = [$this->pipes[1]];
            $write = null;
            $except = null;
            
            $result = stream_select($read, $write, $except, floor($timeout), ($timeout - floor($timeout)) * 1000000);
            
            if ($result === false) {
                throw new \Exception("Error waiting for data from process");
            }
            
            if ($result === 0) {
                return null; // Timeout
            }
        }
        
        // Read line from stdout
        $line = fgets($this->pipes[1]);
        
        if ($line === false) {
            // No data available
            return null;
        }
        
        return rtrim($line, "\r\n");
    }
    
    /**
     * Check if the transport is connected
     *
     * @return bool True if connected
     */
    public function isConnected(): bool
    {
        if (!is_resource($this->process)) {
            return false;
        }
        
        $status = proc_get_status($this->process);
        return $status['running'];
    }
    
    /**
     * Get stderr output
     *
     * @return string The stderr output
     */
    public function getStderr(): string
    {
        if (!$this->isConnected() || !isset($this->pipes[2])) {
            return '';
        }
        
        return stream_get_contents($this->pipes[2]);
    }
    
    /**
     * Get the session ID
     *
     * @return string|null The session ID, or null if not set
     */
    public function getSessionId(): ?string
    {
        return null; // Stdio transport doesn't use session IDs
    }
    
    /**
     * Set the protocol version
     *
     * @param string $version The protocol version
     */
    public function setProtocolVersion(string $version): void
    {
        // Stdio transport doesn't need protocol version
    }
    
    /**
     * Get the protocol version
     *
     * @return string|null The protocol version, or null if not set
     */
    public function getProtocolVersion(): ?string
    {
        return null; // Stdio transport doesn't use protocol version
    }
}
