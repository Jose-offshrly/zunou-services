// Scout AI Proxy - Lambda with Response Streaming
// Handles Text Agent (SSE proxy) and Voice Agent (session creation)
// CORS is handled by Lambda Function URL configuration, not in code
//
// Supports two modes:
// 1. Pass-through mode: Client sends full OpenAI request (legacy/BYOK)
// 2. Obfuscated mode: Client sends session_type, Lambda adds prompts/tools (secure)
//
// Security: JWT validation via Auth0 JWKS (Phase 6)

import { getTools, getRelayConversationTools, getRelayManagerTools, getDirectTools, getDelegatedCapabilitySummary, getHybridStats, buildCapabilities, getSessionDisplayName } from './tools.mjs';
import { getPromptBuilder, getVoicePromptBuilder } from './prompts.mjs';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Default model for text agent
const DEFAULT_MODEL = 'gpt-5.2';

// ═══════════════════════════════════════════════════════════════════════════════
// JWT VALIDATION (Auth0 JWKS)
// ═══════════════════════════════════════════════════════════════════════════════

// Cache the JWKS client per domain
const jwksClients = new Map();

function getJwksClient(auth0Domain) {
  if (!jwksClients.has(auth0Domain)) {
    jwksClients.set(auth0Domain, jwksClient({
      jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    }));
  }
  return jwksClients.get(auth0Domain);
}

/**
 * Validates a JWT token against Auth0 JWKS
 * @param {string} authHeader - The Authorization header value
 * @returns {Promise<{valid: boolean, user?: object, error?: string}>}
 */
async function validateJWT(authHeader) {
  // Check if JWT validation is enabled
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0Audience = process.env.AUTH0_AUDIENCE;
  
  // If no Auth0 config, skip validation (allows gradual rollout)
  if (!auth0Domain) {
    console.log('[JWT] Skipping validation - AUTH0_DOMAIN not configured');
    return { valid: true, user: null, skipped: true };
  }
  
  // Check Authorization header format
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  if (!token || token === 'null' || token === 'undefined') {
    return { valid: false, error: 'Empty or invalid token' };
  }
  
  try {
    // Decode token header to get key ID (kid)
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header?.kid) {
      return { valid: false, error: 'Invalid token format - missing key ID' };
    }
    
    // Get signing key from JWKS
    const client = getJwksClient(auth0Domain);
    const key = await new Promise((resolve, reject) => {
      client.getSigningKey(decoded.header.kid, (err, signingKey) => {
        if (err) reject(err);
        else resolve(signingKey?.getPublicKey());
      });
    });
    
    if (!key) {
      return { valid: false, error: 'Unable to find signing key' };
    }
    
    // Verify token
    const verifyOptions = {
      algorithms: ['RS256'],
      issuer: `https://${auth0Domain}/`,
    };
    
    // Add audience check if configured
    if (auth0Audience) {
      verifyOptions.audience = auth0Audience;
    }
    
    const payload = jwt.verify(token, key, verifyOptions);
    
    // Token is valid
    return {
      valid: true,
      user: {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        // Include any other relevant claims
      }
    };
    
  } catch (err) {
    // Specific error messages for debugging
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    }
    if (err.name === 'JsonWebTokenError') {
      return { valid: false, error: `Invalid token: ${err.message}` };
    }
    if (err.name === 'NotBeforeError') {
      return { valid: false, error: 'Token not yet valid' };
    }
    
    console.error('[JWT] Validation error:', err);
    return { valid: false, error: err.message };
  }
}

/**
 * Helper to send 401 Unauthorized response
 */
function sendUnauthorized(responseStream, metadata, message) {
  metadata.statusCode = 401;
  metadata.headers['Content-Type'] = 'application/json';
  metadata.headers['WWW-Authenticate'] = 'Bearer realm="zunou-ai-proxy"';
  responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
  responseStream.write(JSON.stringify({ error: message }));
  responseStream.end();
  return responseStream;
}

export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  // Determine path for routing
  const path = event.requestContext?.http?.path || '/';
  
  // Set response metadata for SSE
  // Note: CORS headers are handled by Lambda Function URL configuration
  // Do NOT add CORS headers here - it causes duplicate header errors
  const metadata = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  };
  
  // Handle CORS preflight (Function URL handles this, but belt-and-suspenders)
  if (event.requestContext?.http?.method === 'OPTIONS') {
    metadata.statusCode = 204;
    metadata.headers['Content-Type'] = 'text/plain';
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    responseStream.end();
    return;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC: /health - No authentication required
  // ═══════════════════════════════════════════════════════════════════════════
  if (path === '/health') {
    metadata.statusCode = 200;
    metadata.headers['Content-Type'] = 'application/json';
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    responseStream.write(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    responseStream.end();
    return;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // JWT VALIDATION - All endpoints require valid Auth0 token
  // ═══════════════════════════════════════════════════════════════════════════
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  const jwtResult = await validateJWT(authHeader);
  
  if (!jwtResult.valid) {
    console.log('[JWT] Validation failed:', jwtResult.error);
    sendUnauthorized(responseStream, metadata, jwtResult.error);
    return;
  }
  
  if (jwtResult.skipped) {
    console.log('[JWT] Validation skipped (AUTH0_DOMAIN not configured)');
  } else {
    console.log('[JWT] Token valid for user:', jwtResult.user?.sub);
  }
  
  // Route: /realtime → Voice Agent session creation (Phase 4)
  if (path === '/realtime') {
    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      metadata.statusCode = 400;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Invalid JSON body' }));
      responseStream.end();
      return;
    }
    
    const {
      session_type = 'about-me',
      user_context = '',
      additional_context = '',
      day_context = {},  // For day-prep sessions
      debrief_context = null,  // For daily-debrief sessions (structured)
      relay = {},       // For relay-conversation sessions
      model = 'gpt-4o-realtime-preview',
      voice = 'coral',
      language_instruction = '',
      dialect_instruction = '',
      speed_hint = '',
      style_instruction = '',
      // Audio config overrides (optional)
      vad_threshold = 0.3,
      vad_silence_duration_ms = 400,
      // Hybrid mode: use direct tools only + delegation
      // Default TRUE - reduces token usage significantly
      hybrid_mode = true,
    } = body;
    
    // Determine API key: BYOK header takes precedence over env var
    const byokKey = event.headers?.['x-openai-api-key'];
    const apiKey = byokKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'No API key configured' }));
      responseStream.end();
      return;
    }
    
    // Get voice agent tools - filtered by session type
    // relay-conversation uses getRelayConversationTools() for minimal set
    // hybrid_mode uses getDirectTools() for token-efficient subset + delegation
    // other sessions use getTools() with session_type for full access
    let tools;
    let delegatedCapabilities = '';
    let totalToolCount = 0;  // Full capability count (direct + delegated)
    
    if (session_type === 'relay-conversation') {
      tools = getRelayConversationTools();
      totalToolCount = tools.length;
    } else if (session_type === 'relay-manager') {
      tools = getRelayManagerTools();
      totalToolCount = tools.length;
    } else if (hybrid_mode) {
      // Hybrid mode: use direct tools only, add delegation capability summary
      tools = getDirectTools(session_type);
      delegatedCapabilities = getDelegatedCapabilitySummary();
      const stats = getHybridStats(session_type);
      totalToolCount = stats.directCount + stats.delegatedCount;  // Full capability awareness
      console.log('[Lambda] Hybrid mode enabled:', {
        directTools: stats.directCount,
        delegatedTools: stats.delegatedCount,
        totalCapabilities: totalToolCount,
        directTokens: stats.directTokens,
        budgetRemaining: stats.budgetRemaining,
      });
    } else {
      tools = getTools('voice', session_type);
      totalToolCount = tools.length;
    }
    
    // Build system prompt using voice prompt builder (after tools so we can pass count)
    const promptBuilder = getVoicePromptBuilder(session_type);
    let instructions;
    
    if (session_type === 'day-prep') {
      // Day-prep mode: specific day context from Schedule page
      instructions = promptBuilder({
        user_context,
        day_context,
        delegated_capabilities: delegatedCapabilities,  // For hybrid mode
        model,
        tool_count: totalToolCount,  // Use full capability count
      });
    } else if (session_type === 'relay-conversation') {
      // Relay conversation mode: relay object from Relays page
      // Note: _ownerMode flag in relay object enables owner jump-in behavior
      instructions = promptBuilder({
        user_context,
        relay,
        additional_context,
        is_owner_mode: relay._ownerMode === true,
        model,
        tool_count: totalToolCount,
      });
    } else if (session_type === 'relay-landing') {
      // Relay landing mode: owner reviewing completed relay to take action
      // Gets full tool access (unlike relay-conversation)
      const { relay_context } = body;
      
      console.log('[Lambda] Voice relay-landing mode:', {
        hasRelayContext: !!relay_context,
        relayContextLength: relay_context?.length || 0,
      });
      
      instructions = promptBuilder({
        language: body.language || 'English',
        user_context,
        additional_context: {
          relay_context,
        },
        delegated_capabilities: delegatedCapabilities,  // For hybrid mode
        model,
        tool_count: totalToolCount,
      });
    } else if (session_type === 'relay-manager') {
      // Relay manager mode: OWNER checking on their SENT relay (still active/pending)
      // This is NOT for recipients - it's for the sender to get status updates
      const { relay_context } = body;
      
      console.log('[Lambda] Voice relay-manager mode:', {
        hasRelay: !!relay,
        hasRelayContext: !!relay_context,
        relayStatus: relay?.status,
        threadCount: relay?.threads?.length,
      });
      
      instructions = promptBuilder({
        language: body.language || 'English',
        user_context,
        additional_context: {
          relay_context: relay_context || JSON.stringify({ relay }),
        },
        model,
        tool_count: totalToolCount,
      });
    } else if (session_type === 'daily-debrief') {
      // Daily debrief mode - supports structured debrief_context and hybrid mode
      instructions = promptBuilder({
        user_context,
        additional_context,
        debrief_context,  // Structured context (preferred)
        delegated_capabilities: delegatedCapabilities,  // For hybrid mode
        model,
        tool_count: totalToolCount,
      });
    } else {
      // Standard mode
      instructions = promptBuilder({
        user_context,
        additional_context,
        delegated_capabilities: delegatedCapabilities,  // For hybrid mode
        model,
        tool_count: totalToolCount,
      });
    }
    
    // Add language/dialect/speed/style instructions as prefixes
    if (language_instruction) {
      instructions = `${language_instruction}\n\n${instructions}`;
    }
    if (dialect_instruction) {
      instructions = `${dialect_instruction}\n\n${instructions}`;
    }
    if (speed_hint) {
      instructions = `${speed_hint}\n\n${instructions}`;
    }
    if (style_instruction) {
      instructions = `${style_instruction}\n\n${instructions}`;
    }
    
    console.log('[Lambda] Voice session:', session_type, '| tools:', tools.length, '| prompt length:', instructions.length);
    
    // DEBUG: Log first 500 chars of instructions
    console.log('[Lambda] DEBUG - Instructions start:', instructions.substring(0, 500));
    console.log('[Lambda] DEBUG - additional_context:', typeof additional_context, additional_context?.length || 0);
    
    try {
      // Create OpenAI Realtime client secret via REST API
      // Endpoint: /v1/realtime/client_secrets (NOT /v1/realtime/sessions)
      // This returns an ephemeral client token (ek_...) that the frontend uses for WebSocket
      const sessionResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Expiration config
          expires_after: {
            anchor: 'created_at',
            seconds: 120,  // 2 minutes - enough time to connect
          },
          // Session configuration (nested under 'session')
          session: {
            type: 'realtime',  // Required: 'realtime' or 'transcription'
            model,
            instructions,
            tools,
            tool_choice: 'auto',
            // Audio configuration (nested under 'audio' in the new API)
            audio: {
              input: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000,
                },
                transcription: {
                  model: 'gpt-4o-transcribe',
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: vad_threshold,
                  prefix_padding_ms: 250,
                  silence_duration_ms: vad_silence_duration_ms,
                  create_response: true,
                },
              },
              output: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000,
                },
                voice,
              },
            },
          },
        }),
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('OpenAI realtime session error:', sessionResponse.status, errorText);
        metadata.statusCode = sessionResponse.status;
        metadata.headers['Content-Type'] = 'application/json';
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({ error: errorText }));
        responseStream.end();
        return;
      }
      
      const sessionData = await sessionResponse.json();
      
      // DEBUG: Log full session config for troubleshooting
      console.log('[Lambda] DEBUG - OpenAI response keys:', Object.keys(sessionData));
      console.log('[Lambda] DEBUG - Session object:', JSON.stringify(sessionData.session || {}).substring(0, 1000));
      
      // For hybrid mode: create a persistent Text Agent conversation for delegations
      let delegationConversationId = null;
      if (hybrid_mode) {
        try {
          const convResponse = await fetch('https://api.openai.com/v1/conversations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });
          
          if (convResponse.ok) {
            const convData = await convResponse.json();
            delegationConversationId = convData.id;
            console.log('[Lambda] Created delegation conversation:', delegationConversationId);
          } else {
            console.warn('[Lambda] Failed to create delegation conversation:', convResponse.status);
          }
        } catch (convError) {
          console.warn('[Lambda] Error creating delegation conversation:', convError.message);
        }
      }
      
      // Return the session info to the client
      // Response format: { value: "ek_...", expires_at: 123, session: { id, model, ... } }
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({
        token: sessionData.value,  // The ephemeral key (ek_...)
        session_id: sessionData.session?.id,
        expires_at: sessionData.expires_at,
        model: sessionData.session?.model,
        voice: sessionData.session?.audio?.output?.voice,
        tools_count: tools.length,
        total_capabilities: totalToolCount,  // Full capability count for awareness
        delegation_conversation_id: delegationConversationId,  // For persistent delegation context
        // DEBUG: Include prompt length in response for troubleshooting
        _debug: {
          prompt_length: instructions.length,
          prompt_start: instructions.substring(0, 300),
          session_type: session_type,
          hybrid_mode: hybrid_mode,
          additional_context_length: additional_context?.length || 0,
          // Check if OpenAI returned our session config
          openai_returned_model: sessionData.session?.model || 'NOT_SET',
          openai_returned_instructions_length: sessionData.session?.instructions?.length || 0,
          openai_returned_tools_count: sessionData.session?.tools?.length || 0,
        },
      }));
      responseStream.end();
      console.log('[Lambda] Voice session created:', sessionData.session?.id, hybrid_mode ? `(hybrid, delegation: ${delegationConversationId})` : '');
      return;
      
    } catch (error) {
      console.error('Realtime session creation error:', error);
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: error.message }));
      responseStream.end();
      return;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Route: /assemblyai/token → Get streaming token for real-time transcription
  // Accepts GET or POST (POST preferred for iOS Safari compatibility)
  // ═══════════════════════════════════════════════════════════════════════════
  if (path === '/assemblyai/token') {
    const method = event.requestContext?.http?.method?.toUpperCase();
    console.log('[Lambda] /assemblyai/token request, method:', method);
    
    // Determine API key: BYOK header takes precedence over env var
    const byokKey = event.headers?.['x-assemblyai-api-key'];
    const apiKey = byokKey || process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'AssemblyAI API key not configured' }));
      responseStream.end();
      return;
    }
    
    try {
      // Request ephemeral streaming token from AssemblyAI
      // Token is valid for 60 seconds by default
      console.log('[Lambda] Fetching AssemblyAI streaming token...');
      
      const tokenResponse = await fetch('https://streaming.assemblyai.com/v3/token?expires_in_seconds=60', {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
        },
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('AssemblyAI token error:', tokenResponse.status, errorText);
        metadata.statusCode = tokenResponse.status;
        metadata.headers['Content-Type'] = 'application/json';
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({ error: `Failed to get token: ${errorText}` }));
        responseStream.end();
        return;
      }
      
      const tokenData = await tokenResponse.json();
      
      console.log('[Lambda] AssemblyAI streaming token obtained, expires in:', tokenData.expires_in_seconds, 's');
      
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({
        token: tokenData.token,
        expires_in_seconds: tokenData.expires_in_seconds,
      }));
      responseStream.end();
      return;
      
    } catch (error) {
      console.error('AssemblyAI token error:', error);
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: error.message }));
      responseStream.end();
      return;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Route: /assemblyai/transcribe → Speaker diarization proxy
  // ═══════════════════════════════════════════════════════════════════════════
  if (path === '/assemblyai/transcribe') {
    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      metadata.statusCode = 400;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Invalid JSON body' }));
      responseStream.end();
      return;
    }
    
    const { audio_data, audio_url, speaker_labels = true, speakers_expected } = body;
    
    // Validate: need either audio_data or audio_url
    if (!audio_data && !audio_url) {
      metadata.statusCode = 400;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Missing required field: audio_data or audio_url' }));
      responseStream.end();
      return;
    }
    
    // Determine API key: BYOK header takes precedence over env var
    const byokKey = event.headers?.['x-assemblyai-api-key'];
    const apiKey = byokKey || process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'AssemblyAI API key not configured' }));
      responseStream.end();
      return;
    }
    
    const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
    
    try {
      let uploadUrl = audio_url;
      
      // Step 1: Upload audio if base64 data provided
      if (audio_data) {
        console.log('[Lambda] Uploading audio to AssemblyAI...');
        
        // Decode base64 to binary
        const audioBuffer = Buffer.from(audio_data, 'base64');
        
        const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/octet-stream',
          },
          body: audioBuffer,
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('AssemblyAI upload error:', uploadResponse.status, errorText);
          metadata.statusCode = uploadResponse.status;
          metadata.headers['Content-Type'] = 'application/json';
          responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
          responseStream.write(JSON.stringify({ error: `Upload failed: ${errorText}` }));
          responseStream.end();
          return;
        }
        
        const uploadResult = await uploadResponse.json();
        uploadUrl = uploadResult.upload_url;
        console.log('[Lambda] Audio uploaded to:', uploadUrl);
      }
      
      // Step 2: Request transcription with speaker diarization
      console.log('[Lambda] Requesting transcription with speaker_labels:', speaker_labels);
      
      const transcriptRequest = {
        audio_url: uploadUrl,
        speaker_labels,
      };
      
      if (speakers_expected) {
        transcriptRequest.speakers_expected = speakers_expected;
      }
      
      const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptRequest),
      });
      
      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        console.error('AssemblyAI transcript request error:', transcriptResponse.status, errorText);
        metadata.statusCode = transcriptResponse.status;
        metadata.headers['Content-Type'] = 'application/json';
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({ error: `Transcription request failed: ${errorText}` }));
        responseStream.end();
        return;
      }
      
      const transcriptData = await transcriptResponse.json();
      const transcriptId = transcriptData.id;
      console.log('[Lambda] Transcription queued:', transcriptId);
      
      // Step 3: Poll for completion
      const maxPolls = 120;  // 10 minutes max (5s intervals)
      const pollInterval = 5000;
      
      for (let poll = 0; poll < maxPolls; poll++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const statusResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
          headers: {
            'Authorization': apiKey,
          },
        });
        
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error('AssemblyAI status check error:', statusResponse.status, errorText);
          continue;  // Retry
        }
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          console.log('[Lambda] Transcription completed:', transcriptId);
          
          metadata.headers['Content-Type'] = 'application/json';
          responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
          responseStream.write(JSON.stringify({
            success: true,
            transcript: {
              id: statusData.id,
              text: statusData.text,
              utterances: statusData.utterances || [],
              words: statusData.words || [],
            },
          }));
          responseStream.end();
          return;
        }
        
        if (statusData.status === 'error') {
          console.error('[Lambda] Transcription failed:', statusData.error);
          metadata.statusCode = 500;
          metadata.headers['Content-Type'] = 'application/json';
          responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
          responseStream.write(JSON.stringify({ error: statusData.error || 'Transcription failed' }));
          responseStream.end();
          return;
        }
        
        console.log('[Lambda] Transcription status:', statusData.status, `(poll ${poll + 1}/${maxPolls})`);
      }
      
      // Timeout
      metadata.statusCode = 504;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Transcription timed out' }));
      responseStream.end();
      return;
      
    } catch (error) {
      console.error('AssemblyAI proxy error:', error);
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: error.message }));
      responseStream.end();
      return;
    }
  }
  
  // Route: /conversations → Create conversation for multi-turn state
  if (path === '/conversations') {
    // Determine API key: BYOK header takes precedence over env var
    const byokKey = event.headers?.['x-openai-api-key'];
    const apiKey = byokKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'No API key configured' }));
      responseStream.end();
      return;
    }
    
    // Parse optional body for metadata
    let conversationMetadata = {};
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      conversationMetadata = body.metadata || {};
    } catch (e) {
      // Ignore parse errors, use empty metadata
    }
    
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            agent: 'text-agent',
            created: new Date().toISOString(),
            ...conversationMetadata,
          }
        }),
      });
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI conversations error:', openaiResponse.status, errorText);
        metadata.statusCode = openaiResponse.status;
        metadata.headers['Content-Type'] = 'application/json';
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({ error: errorText }));
        responseStream.end();
        return;
      }
      
      const conversationData = await openaiResponse.json();
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify(conversationData));
      responseStream.end();
      console.log('[Lambda] Created conversation:', conversationData.id);
      return;
      
    } catch (error) {
      console.error('Conversation creation error:', error);
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: error.message }));
      responseStream.end();
      return;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Route: /delegate → Hybrid Mode Tool Delegation (Non-Streaming)
  // Voice Agent delegates actions to Text Agent, receives structured JSON response
  // ═══════════════════════════════════════════════════════════════════════════
  if (path === '/delegate') {
    metadata.headers['Content-Type'] = 'application/json';
    
    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      metadata.statusCode = 400;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Invalid JSON body' }));
      responseStream.end();
      return;
    }
    
    const {
      action,
      category,
      entities = {},
      urgency = 'normal',
      session_type = 'general',
      user_context = '',
      tool_name = null, // Specific tool to call (if Voice Agent knows it)
      tool_outputs = [], // Tool outputs from previous turn (for multi-turn)
      previous_response_id = null, // For multi-turn context
    } = body;
    
    // Validate required fields
    if (!action || !category) {
      metadata.statusCode = 400;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Missing required fields: action, category' }));
      responseStream.end();
      return;
    }
    
    // Determine API key
    const byokKey = event.headers?.['x-openai-api-key'];
    const apiKey = byokKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      metadata.statusCode = 500;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'No API key configured' }));
      responseStream.end();
      return;
    }
    
    // Build instruction based on whether tool_name is provided
    let instruction;
    
    if (tool_name) {
      // Direct tool execution - Voice Agent specified exactly which tool to call
      let contextInfo = '';
      if (Object.keys(entities).length > 0) {
        contextInfo = `\n\nENTITIES FROM SESSION:\n${Object.entries(entities).map(([ref, data]) => `  ${ref}: ${JSON.stringify(data)}`).join('\n')}`;
      }
      
      instruction = `EXECUTE TOOL: ${tool_name}

USER REQUEST: ${action}

Call the "${tool_name}" tool with appropriate parameters based on the user's request.${contextInfo}

After executing, provide a brief spoken summary of the result.`;
    } else {
      // Legacy mode - let Text Agent figure out which tool(s) to use
      let contextParts = [];
      contextParts.push(`DELEGATED ACTION: ${action}`);
      contextParts.push(`CATEGORY: ${category}`);
      contextParts.push(`URGENCY: ${urgency}`);
      
      if (Object.keys(entities).length > 0) {
        contextParts.push(`\nENTITIES FROM SESSION:`);
        for (const [ref, data] of Object.entries(entities)) {
          contextParts.push(`  ${ref}: ${JSON.stringify(data)}`);
        }
      }
      
      instruction = `Execute this delegated action from the Voice Agent:

${contextParts.join('\n')}

Execute the action and return the result. Be concise - the Voice Agent will speak the result to the user.`;
    }
    
    // Get tools for this session type
    const tools = getTools('text', session_type);
    
    // Build system prompt
    const systemPrompt = `You are Zunou's Text Agent, executing a delegated action from the Voice Agent.

IMPORTANT:
- Execute the requested action using the appropriate tools
- Be concise in your text response - it will be spoken aloud
- If using display tools (show_events, show_relays, etc.), also provide a brief spoken summary
- After lookups, ALWAYS use the corresponding show_* tool to display results visually
${user_context ? `\nABOUT THE USER:\n${user_context}` : ''}`;
    
    // Determine if this is a continuation with tool outputs
    const isMultiTurn = tool_outputs && tool_outputs.length > 0;
    console.log('[Lambda] /delegate:', category, '|', action.substring(0, 50), isMultiTurn ? `(continuing with ${tool_outputs.length} tool outputs)` : '');
    
    try {
      // Build input - either fresh instruction or tool outputs for continuation
      let input;
      if (isMultiTurn) {
        // Multi-turn within same action: Send tool outputs as function_call_output items
        input = tool_outputs.map(to => ({
          type: 'function_call_output',
          call_id: to.call_id,
          output: to.output
        }));
        console.log('[Lambda] /delegate sending tool outputs:', input.map(i => i.call_id));
      } else {
        // New action: Send user instruction
        input = [{ role: 'user', content: instruction }];
      }
      
      // Call OpenAI Responses API (NON-streaming for reliable response_id capture)
      const openaiRequest = {
        model: DEFAULT_MODEL,
        stream: false,  // Don't stream - we need reliable response_id for multi-turn
        instructions: systemPrompt,
        input,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
      };
      
      // Include previous_response_id for session continuity
      // This works for both multi-turn (tool outputs) AND new actions in same session
      if (previous_response_id) {
        openaiRequest.previous_response_id = previous_response_id;
        console.log('[Lambda] /delegate using previous_response_id:', previous_response_id, 'isMultiTurn:', isMultiTurn);
      }
      
      const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiRequest),
      });
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('[Lambda] /delegate OpenAI error:', openaiResponse.status, errorText);
        
        // Parse OpenAI error for better messaging
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorDetail = errorJson.error.message;
          }
        } catch (e) {
          // Keep raw text
        }
        
        // Return 200 with error payload so client can parse it
        // (returning 400 causes response.ok to be false and we lose JSON parsing)
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({ 
          success: false, 
          error: errorDetail,
          openai_status: openaiResponse.status,
          speak_to_user: 'I ran into an issue with that request.'
        }));
        responseStream.end();
        return;
      }
      
      // Parse non-streaming response directly
      const result = await openaiResponse.json();
      console.log('[Lambda] /delegate response id:', result.id);
      
      let fullText = '';
      let toolCalls = [];
      const responseId = result.id;  // Direct access to response ID
      
      // Extract text and tool calls from output
      for (const item of (result.output || [])) {
        if (item.type === 'message' && item.content) {
          for (const c of item.content) {
            if (c.type === 'output_text' && c.text) {
              fullText += c.text;
            }
          }
        }
        if (item.type === 'function_call' && item.name) {
          const funcArgs = typeof item.arguments === 'string'
            ? JSON.parse(item.arguments || '{}')
            : (item.arguments || {});
          toolCalls.push({
            name: item.name,
            arguments: funcArgs,
            call_id: item.call_id || item.id
          });
        }
      }
      
      console.log('[Lambda] /delegate complete:', toolCalls.length, 'tool(s),', fullText.length, 'chars text, response_id:', responseId);
      console.log('[Lambda] /delegate tool_calls:', JSON.stringify(toolCalls, null, 2));
      
      // Return structured response
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({
        success: true,
        response_id: responseId,
        text: fullText,
        tool_calls: toolCalls,
        speak_to_user: fullText || (toolCalls.length > 0 ? 'Done.' : 'I wasn\'t able to complete that action.')
      }));
      responseStream.end();
      return;
      
    } catch (error) {
      console.error('[Lambda] /delegate error:', error);
      metadata.statusCode = 500;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ success: false, error: error.message }));
      responseStream.end();
      return;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Route: /nudge-evaluate → AI-driven nudge evaluation (Internal use)
  // Called by relay-service to decide if/when to send contextual reminders
  // ═══════════════════════════════════════════════════════════════════════════════
  if (path === '/nudge-evaluate') {
    metadata.headers['Content-Type'] = 'application/json';

    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      metadata.statusCode = 400;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Invalid JSON body' }));
      responseStream.end();
      return;
    }

    const { relay, thread, owner, timing, policy, forced } = body;

    // Validate required fields
    if (!relay || !thread || !timing) {
      metadata.statusCode = 400;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Missing required fields: relay, thread, timing' }));
      responseStream.end();
      return;
    }

    // Determine API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      metadata.statusCode = 500;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'No API key configured' }));
      responseStream.end();
      return;
    }

    console.log(`[Lambda] /nudge-evaluate: thread=${thread.id}, days_pending=${timing.days_pending}, forced=${forced || false}`);

    try {
      // Import prompt builder
      const { buildNudgeEvaluationPrompt } = await import('./prompts.mjs');
      const systemPrompt = buildNudgeEvaluationPrompt({ relay, thread, owner, timing, policy, forced });

      // Call OpenAI non-streaming for reliable JSON response
      const openaiRequest = {
        model: 'gpt-4o-mini',  // Use fast, cheap model for nudge decisions
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Evaluate whether to send a nudge and generate the message if appropriate. Respond with JSON only.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500
      };

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiRequest),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('[Lambda] /nudge-evaluate OpenAI error:', errorText);
        metadata.statusCode = 500;
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({
          should_nudge: false,
          reasoning: 'AI evaluation failed',
          next_check_hours: 6
        }));
        responseStream.end();
        return;
      }

      const result = await openaiResponse.json();
      const content = result.choices?.[0]?.message?.content;

      let decision;
      try {
        decision = JSON.parse(content);
      } catch (parseErr) {
        console.error('[Lambda] /nudge-evaluate JSON parse error:', parseErr.message);
        decision = {
          should_nudge: false,
          reasoning: 'Failed to parse AI response',
          next_check_hours: 12
        };
      }

      console.log(`[Lambda] /nudge-evaluate result: should_nudge=${decision.should_nudge}, reasoning="${decision.reasoning?.substring(0, 50)}..."`);

      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify(decision));
      responseStream.end();
      return;

    } catch (error) {
      console.error('[Lambda] /nudge-evaluate error:', error);
      metadata.statusCode = 500;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({
        should_nudge: false,
        reasoning: 'Evaluation error: ' + error.message,
        next_check_hours: 6
      }));
      responseStream.end();
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Route: /synthesize-report → AI-generated synthesis report (Internal use)
  // Called by relay-service to generate intelligent report summaries
  // ═══════════════════════════════════════════════════════════════════════════════
  if (path === '/synthesize-report') {
    metadata.headers['Content-Type'] = 'application/json';

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      metadata.statusCode = 400;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Invalid JSON body' }));
      responseStream.end();
      return;
    }

    const { relay, threads, insights, owner } = body;

    if (!relay || !threads) {
      metadata.statusCode = 400;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Missing required fields: relay, threads' }));
      responseStream.end();
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      metadata.statusCode = 500;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'No API key configured' }));
      responseStream.end();
      return;
    }

    console.log(`[Lambda] /synthesize-report: relay=${relay.id}, threads=${threads.length}, insights=${insights?.length || 0}`);

    try {
      // Build context for AI - use conversation if no thread_summary
      const threadSummaries = threads
        .filter(t => t.status === 'complete')
        .map(t => {
          // If we have a thread_summary, use it
          if (t.thread_summary) {
            return `${t.recipient_name}: ${t.thread_summary}`;
          }
          // Otherwise, extract from conversation
          if (t.conversation && t.conversation.length > 0) {
            const userMessages = t.conversation
              .filter(m => m.role === 'user')
              .map(m => m.content)
              .slice(-5); // Last 5 user messages
            if (userMessages.length > 0) {
              return `${t.recipient_name} said:\n${userMessages.map(m => `  "${m}"`).join('\n')}`;
            }
          }
          return `${t.recipient_name}: Completed (no detailed response captured)`;
        })
        .join('\n\n');

      const insightsList = (insights || [])
        .map(i => `- ${i.content} (from ${i.source})`)
        .join('\n');

      const systemPrompt = `You are Zunou, an AI assistant synthesizing responses to answer a question or complete a task.

ORIGINAL REQUEST from ${owner?.name || 'the user'}:
"${relay.mission?.objective || relay.objective}"
${relay.mission?.context ? `Context: ${relay.mission.context}` : ''}

RESPONSES RECEIVED:
${threadSummaries || 'No responses available'}

${insightsList ? `KEY INSIGHTS GATHERED:\n${insightsList}` : ''}

Your task: Write a clear, concise summary that DIRECTLY ANSWERS the original question/request.
- Focus on what was learned - the actual answer to the question
- Extract the key information from the responses
- Be specific and actionable
- Write 2-4 sentences max

Respond with JSON:
{
  "summary": "The actual answer/findings in plain English",
  "headline": "One-line summary (max 10 words)",
  "confidence": "high" | "medium" | "low"
}`;

      const openaiRequest = {
        model: 'gpt-4o-mini',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the synthesis report summary.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 400
      };

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiRequest),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('[Lambda] /synthesize-report OpenAI error:', errorText);
        metadata.statusCode = 500;
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        responseStream.write(JSON.stringify({
          summary: 'Unable to generate AI summary',
          headline: 'Report generated',
          confidence: 'low'
        }));
        responseStream.end();
        return;
      }

      const result = await openaiResponse.json();
      const content = result.choices?.[0]?.message?.content;

      let synthesis;
      try {
        synthesis = JSON.parse(content);
      } catch (parseErr) {
        console.error('[Lambda] /synthesize-report JSON parse error:', parseErr.message);
        synthesis = {
          summary: content || 'Report generated',
          headline: 'Report ready',
          confidence: 'low'
        };
      }

      console.log(`[Lambda] /synthesize-report result: headline="${synthesis.headline}", confidence=${synthesis.confidence}`);

      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify(synthesis));
      responseStream.end();
      return;

    } catch (error) {
      console.error('[Lambda] /synthesize-report error:', error);
      metadata.statusCode = 500;
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({
        summary: 'Error generating report: ' + error.message,
        headline: 'Report error',
        confidence: 'low'
      }));
      responseStream.end();
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Route: /capabilities → Dynamic help system
  // Returns capabilities grouped by category for the help modal
  // ═══════════════════════════════════════════════════════════════════════════════
  if (path === '/capabilities') {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const sessionType = queryParams.session_type || 'daily-debrief';
    const agentType = queryParams.agent || 'voice';
    
    try {
      // Build capabilities for this session/agent
      const categories = buildCapabilities(sessionType, agentType);
      const sessionName = getSessionDisplayName(sessionType);
      
      console.log(`[Lambda] /capabilities: session=${sessionType}, agent=${agentType}, categories=${categories.length}`);
      
      // Get agent version from environment
      const agentVersion = process.env.AGENT_VERSION || 'local-dev';
      
      // Return as JSON (not SSE)
      metadata.headers['Content-Type'] = 'application/json';
      metadata.headers['Cache-Control'] = 'public, max-age=300';  // Cache for 5 minutes
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({
        success: true,
        session_type: sessionType,
        session_name: sessionName,
        agent: agentType,
        agent_version: agentVersion,
        categories: categories,
        total_items: categories.reduce((sum, cat) => sum + cat.items.length, 0)
      }));
      responseStream.end();
      return;
      
    } catch (error) {
      console.error('[Lambda] /capabilities error:', error);
      metadata.statusCode = 500;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ success: false, error: error.message }));
      responseStream.end();
      return;
    }
  }
  
  // Route: /responses → Text Agent SSE proxy
  // Reject unknown paths explicitly
  if (path !== '/responses') {
    metadata.statusCode = 404;
    metadata.headers['Content-Type'] = 'application/json';
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    responseStream.write(JSON.stringify({ error: `Unknown endpoint: ${path}` }));
    responseStream.end();
    return;
  }
  
  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    metadata.statusCode = 400;
    metadata.headers['Content-Type'] = 'application/json';
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    responseStream.write(JSON.stringify({ error: 'Invalid JSON body' }));
    responseStream.end();
    return;
  }
  
  // Determine which mode we're in
  // Obfuscated mode: has session_type and we build the prompt server-side
  // Pass-through mode: no session_type, request goes to OpenAI as-is
  // Note: 'draft' session_type passes 'instructions' as task instructions, not OpenAI instructions
  const isObfuscatedMode = !!body.session_type && !body.tools;
  
  let openaiRequest;
  
  if (isObfuscatedMode) {
    // ═══════════════════════════════════════════════════════════════════════════
    // OBFUSCATED MODE: Build request from session_type
    // ═══════════════════════════════════════════════════════════════════════════
    
    const {
      session_type = 'general',
      input,
      user_context = '',
      additional_context = {},
      language = 'English',
      time_of_day = 'morning',
      model = DEFAULT_MODEL,
      temperature = 0.7,
      max_output_tokens,  // Optional: limit output length
      conversation,  // Optional: for multi-turn
    } = body;
    
    // Validate required field
    if (!input) {
      metadata.statusCode = 400;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Missing required field: input' }));
      responseStream.end();
      return;
    }
    
    // Determine tools FIRST so we can pass count to prompt builder
    // Relay conversations get a minimal tool set
    // Digest and draft sessions don't use tools
    // Other sessions get tools filtered by session_type for granular control
    let tools = [];
    if (session_type !== 'digest' && session_type !== 'draft') {
      if (session_type === 'relay-conversation') {
        tools = getRelayConversationTools();
      } else if (session_type === 'relay-manager') {
        tools = getRelayManagerTools();
      } else {
        tools = getTools('text', session_type);
      }
    }
    
    // Build system prompt using the prompt builder
    const promptBuilder = getPromptBuilder(session_type);
    
    // Draft session type has different parameters
    let instructions;
    if (session_type === 'draft') {
      // Draft mode: use task-specific parameters
      const {
        task_type = 'other',
        instructions: draftInstructions = '',
        context = '',
        recipient = '',
        subject = '',
      } = body;
      
      instructions = promptBuilder({
        task_type,
        instructions: draftInstructions,
        context,
        recipient,
        subject,
        user_context, // Pass user context so draft knows user's name, org, etc.
        model,
        tool_count: tools.length,
      });
    } else if (session_type === 'day-prep') {
      // Day-prep mode: specific day context from Schedule page
      const { day_context = {} } = body;
      
      instructions = promptBuilder({
        language,
        user_context,
        day_context,
        model,
        tool_count: tools.length,
      });
    } else if (session_type === 'relay-conversation') {
      // Relay conversation mode: AI agent talking to relay recipient
      const { 
        relay = {}, 
        owner_name = '', 
        owner_id = '',
        owner_email = '',
        recipient_name = '',
        recipient_id = ''
      } = body;
      
      instructions = promptBuilder({
        language,
        relay,
        owner_name,
        owner_id,
        owner_email,
        recipient_name,
        recipient_id,
        user_context,
        model,
        tool_count: tools.length,
      });
    } else if (session_type === 'relay-manager') {
      // Relay manager mode: OWNER checking on their SENT relay (still active/pending)
      // This is for the sender to get status updates, NOT for recipients
      const { relay = {}, relay_context = '' } = body;
      
      console.log('[Lambda] Text relay-manager mode:', {
        hasRelay: !!relay,
        relayId: relay?.id,
        relayStatus: relay?.status,
        threadCount: relay?.threads?.length,
        threadNames: relay?.threads?.map(t => t.recipient_name),
        hasRelayContext: !!relay_context,
      });
      
      // Build relay context JSON for the prompt
      const relayContextJson = relay_context || JSON.stringify({ 
        relay,
        owner_name: relay.owner_name || body.owner_name,
      });
      
      console.log('[Lambda] relay-manager relayContextJson length:', relayContextJson.length);
      
      instructions = promptBuilder({
        language,
        user_context,
        additional_context: {
          relay_context: relayContextJson,
        },
        model,
        tool_count: tools.length,
      });
    } else {
      // Standard mode: use normal parameters
      instructions = promptBuilder({
        language,
        time_of_day,
        user_context,
        additional_context,
        model,
        tool_count: tools.length,
      });
    }
    
    // Build the OpenAI request
    openaiRequest = {
      model,
      stream: true,
      instructions,
      input,
      temperature,
    };
    
    // Add tools for interactive sessions (digest and draft are simple text generation)
    if (tools.length > 0) {
      openaiRequest.tools = tools;
      openaiRequest.tool_choice = 'auto';
    }
    
    // Add max_output_tokens if specified
    if (max_output_tokens) {
      openaiRequest.max_output_tokens = max_output_tokens;
    }
    
    // Add conversation for multi-turn if provided
    if (conversation) {
      openaiRequest.conversation = conversation;
    }
    
    console.log('[Lambda] Obfuscated mode:', session_type, '| tools:', tools.length, '| prompt length:', instructions.length);
    
  } else {
    // ═══════════════════════════════════════════════════════════════════════════
    // PASS-THROUGH MODE: Forward request as-is (legacy/BYOK compatibility)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Validate required fields for pass-through
    if (!body.model || !body.input) {
      metadata.statusCode = 400;
      metadata.headers['Content-Type'] = 'application/json';
      responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      responseStream.write(JSON.stringify({ error: 'Missing required fields: model, input' }));
      responseStream.end();
      return;
    }
    
    // Use request as-is, just ensure streaming
    openaiRequest = {
      ...body,
      stream: true,
    };
    
    console.log('[Lambda] Pass-through mode | model:', body.model);
  }
  
  // Determine API key: BYOK header takes precedence over env var
  const byokKey = event.headers?.['x-openai-api-key'];
  const apiKey = byokKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    metadata.statusCode = 500;
    metadata.headers['Content-Type'] = 'application/json';
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    responseStream.write(JSON.stringify({ error: 'No API key configured' }));
    responseStream.end();
    return;
  }
  
  // Apply response stream metadata
  responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
  
  try {
    // Call OpenAI Responses API
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequest),
    });
    
    // Check for OpenAI errors
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', openaiResponse.status, errorText);
      responseStream.write(`event: error\ndata: ${JSON.stringify({ error: errorText })}\n\n`);
      responseStream.end();
      return;
    }
    
    // Pipe OpenAI's SSE stream directly to client
    const reader = openaiResponse.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      responseStream.write(value);
    }
    
    responseStream.end();
    
  } catch (error) {
    console.error('Proxy error:', error);
    responseStream.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    responseStream.end();
  }
});