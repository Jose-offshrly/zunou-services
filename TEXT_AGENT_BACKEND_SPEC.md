# Text Agent Backend Streaming Proxy Specification

## Overview

The Scout app's **Text Agent** feature provides an AI chat interface using OpenAI's Responses API. Currently, it only works with user-provided API keys (BYOK). We need a backend streaming proxy to enable Text Agent for all users using the organization's OpenAI API key.

The proxy must support **Server-Sent Events (SSE) streaming** so that AI responses appear character-by-character in the UI (the "typing out" effect).

---

## Questions for Backend Team

Before implementation, please clarify:

1. **REST vs GraphQL**: Given your Laravel setup, which approach do you prefer?
   - **REST endpoint with SSE** (simpler, common pattern for streaming)
   - **GraphQL with streaming** (keeps API consistent but more complex)

2. **OpenAI API Key Storage**: Where is the organization's OpenAI API key stored?
   - Is it per-organization in the database?
   - Is it an environment variable?
   - Is it the same key used for `generateRealtimeClientSecret`?

3. **Rate Limiting**: Do you want to implement rate limiting on this endpoint?
   - Per-user limits?
   - Per-organization limits?

---

## Feature Requirements

### Core Functionality

1. Accept a conversation (messages array) and optional tools from the frontend
2. Call OpenAI's Responses API with the organization's API key
3. Stream the response back to the client in real-time via SSE
4. Handle tool calls (function calling) - return tool call requests to client
5. Support conversation continuity (previous_response_id for multi-turn)

### Security Requirements

1. Authenticate requests using the existing JWT/Auth0 token
2. Validate the user belongs to the specified organization
3. Never expose the OpenAI API key to the client
4. Log usage for billing/monitoring purposes

---

## Option A: REST Endpoint with SSE (Recommended)

### Endpoint

```
POST /api/v1/text-agent/completion
Content-Type: application/json
Authorization: Bearer {jwt_token}
Accept: text/event-stream
```

### Request Body

```json
{
  "organization_id": "uuid-of-organization",
  "model": "gpt-4.1",
  "instructions": "You are Scout, an AI assistant...",
  "input": [
    {
      "role": "user",
      "content": "What meetings do I have today?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "name": "lookup_events",
      "description": "Look up calendar events",
      "parameters": {
        "type": "object",
        "properties": {
          "date": { "type": "string" }
        }
      }
    }
  ],
  "previous_response_id": "resp_abc123",
  "stream": true
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `organization_id` | string | Yes | Organization UUID for key lookup |
| `model` | string | No | OpenAI model (default: `gpt-4.1`) |
| `instructions` | string | Yes | System prompt for the AI |
| `input` | array | Yes | Conversation messages (OpenAI format) |
| `tools` | array | No | Function definitions for tool calling |
| `previous_response_id` | string | No | For multi-turn conversations |
| `stream` | boolean | No | Always true for this endpoint |

### Response (SSE Stream)

The response should be `Content-Type: text/event-stream` with events in this format:

```
event: response.output_text.delta
data: {"type":"response.output_text.delta","delta":"Hello"}

event: response.output_text.delta
data: {"type":"response.output_text.delta","delta":" there"}

event: response.output_text.delta
data: {"type":"response.output_text.delta","delta":"!"}

event: response.function_call_arguments.delta
data: {"type":"response.function_call_arguments.delta","call_id":"call_123","name":"lookup_events","arguments":"{\"date\":"}

event: response.function_call_arguments.done
data: {"type":"response.function_call_arguments.done","call_id":"call_123","name":"lookup_events","arguments":"{\"date\":\"2024-12-18\"}"}

event: response.completed
data: {"type":"response.completed","response_id":"resp_xyz789"}

event: done
data: [DONE]
```

### SSE Event Types

| Event Type | Description |
|------------|-------------|
| `response.output_text.delta` | Text chunk to display |
| `response.function_call_arguments.delta` | Partial function call arguments |
| `response.function_call_arguments.done` | Complete function call ready to execute |
| `response.completed` | Response finished, includes response_id for continuity |
| `error` | Error occurred |
| `done` | Stream complete |

### Error Response

```
event: error
data: {"type":"error","code":"rate_limit","message":"Rate limit exceeded"}

event: done
data: [DONE]
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Invalid or missing JWT token |
| `forbidden` | 403 | User not in organization |
| `invalid_request` | 400 | Malformed request body |
| `api_key_missing` | 500 | Organization has no OpenAI key configured |
| `openai_error` | 502 | OpenAI API returned an error |
| `rate_limit` | 429 | Rate limit exceeded |

---

## Option B: GraphQL Mutation (Alternative)

If you prefer to keep everything in GraphQL, you could use a mutation that returns the response in chunks. However, GraphQL subscriptions add complexity.

### Simple Mutation (Non-Streaming)

```graphql
mutation TextAgentCompletion($input: TextAgentInput!) {
  textAgentCompletion(input: $input) {
    response_id
    output {
      type
      content
    }
    tool_calls {
      call_id
      name
      arguments
    }
  }
}
```

**Note**: This won't give the streaming "typing" effect. The full response would appear at once.

### GraphQL Subscription (Streaming)

```graphql
subscription TextAgentStream($input: TextAgentInput!) {
  textAgentStream(input: $input) {
    type
    delta
    call_id
    name
    arguments
    response_id
  }
}
```

This requires WebSocket support for subscriptions in your GraphQL setup.

---

## OpenAI API Reference

The backend should call OpenAI's Responses API:

### Endpoint
```
POST https://api.openai.com/v1/responses
Authorization: Bearer {openai_api_key}
Content-Type: application/json
```

### Request to OpenAI
```json
{
  "model": "gpt-4.1",
  "instructions": "You are Scout...",
  "input": [...],
  "tools": [...],
  "previous_response_id": "resp_abc123",
  "stream": true
}
```

### Streaming from OpenAI

OpenAI returns SSE events. Your backend should:
1. Open a streaming connection to OpenAI
2. Read each SSE event as it arrives
3. Forward it to the client immediately
4. Handle connection errors gracefully

### OpenAI SSE Events to Forward

| OpenAI Event | Forward As |
|--------------|------------|
| `response.output_text.delta` | `response.output_text.delta` |
| `response.function_call_arguments.delta` | `response.function_call_arguments.delta` |
| `response.function_call_arguments.done` | `response.function_call_arguments.done` |
| `response.completed` | `response.completed` |

---

## Laravel Implementation Notes

### SSE in Laravel

Laravel can handle SSE responses using `StreamedResponse`:

```php
use Symfony\Component\HttpFoundation\StreamedResponse;

public function completion(Request $request): StreamedResponse
{
    return new StreamedResponse(function () use ($request) {
        // Disable output buffering
        if (ob_get_level()) ob_end_clean();
        
        // Set up OpenAI streaming connection
        $stream = $this->openAIService->streamCompletion($request->all());
        
        foreach ($stream as $event) {
            echo "event: {$event['type']}\n";
            echo "data: " . json_encode($event) . "\n\n";
            
            // Flush immediately
            if (ob_get_level()) ob_flush();
            flush();
        }
        
        echo "event: done\n";
        echo "data: [DONE]\n\n";
        flush();
        
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache',
        'Connection' => 'keep-alive',
        'X-Accel-Buffering' => 'no', // For Nginx
    ]);
}
```

### OpenAI PHP SDK

If using the official OpenAI PHP SDK:

```php
use OpenAI\Laravel\Facades\OpenAI;

$stream = OpenAI::responses()->createStreamed([
    'model' => 'gpt-4.1',
    'instructions' => $instructions,
    'input' => $messages,
    'tools' => $tools,
]);

foreach ($stream as $response) {
    // Forward each chunk to client
    yield $response;
}
```

Or using Guzzle for raw HTTP streaming:

```php
use GuzzleHttp\Client;

$client = new Client();
$response = $client->post('https://api.openai.com/v1/responses', [
    'headers' => [
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
    ],
    'json' => $requestBody,
    'stream' => true,
]);

$body = $response->getBody();
while (!$body->eof()) {
    $line = $body->read(1024);
    // Parse SSE and forward
}
```

---

## Frontend Integration

Once the backend endpoint is ready, the frontend will call it like this:

```javascript
const response = await fetch('/api/v1/text-agent/completion', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  },
  body: JSON.stringify({
    organization_id: orgId,
    instructions: systemPrompt,
    input: messages,
    tools: tools,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE events and update UI
}
```

---

## Testing

### Test Cases

1. **Basic completion**: Send a simple message, verify streaming response
2. **Tool calling**: Send a message that triggers a tool call, verify `function_call_arguments.done` event
3. **Multi-turn**: Use `previous_response_id` to continue a conversation
4. **Error handling**: Invalid token, missing org key, OpenAI errors
5. **Long responses**: Verify streaming works for responses > 1000 tokens

### Example cURL Test

```bash
curl -X POST https://your-api.com/api/v1/text-agent/completion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "organization_id": "your-org-uuid",
    "instructions": "You are a helpful assistant.",
    "input": [{"role": "user", "content": "Say hello in 3 words"}]
  }'
```

Expected output:
```
event: response.output_text.delta
data: {"type":"response.output_text.delta","delta":"Hello"}

event: response.output_text.delta
data: {"type":"response.output_text.delta","delta":" there"}

event: response.output_text.delta
data: {"type":"response.output_text.delta","delta":" friend"}

event: response.completed
data: {"type":"response.completed","response_id":"resp_abc123"}

event: done
data: [DONE]
```

---

## Deliverables

1. **Streaming endpoint** (REST or GraphQL based on your preference)
2. **Authentication** using existing JWT/Auth0 setup
3. **Organization key lookup** from wherever keys are stored
4. **Error handling** with proper error codes
5. **Basic logging** for usage tracking

---

## Questions?

Please reach out if you need clarification on:
- The exact SSE event format
- Tool/function calling flow
- Multi-turn conversation handling
- Any other aspect of this spec

Once the endpoint is ready, share the URL and we'll integrate it into the frontend Text Agent.
