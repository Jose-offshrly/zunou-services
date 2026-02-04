/**
 * Log handling: decode subscription payload, parse log lines, fetch request logs from CloudWatch.
 */

import zlib from 'zlib';
import { FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

// --- decode ---

/**
 * Decode the CloudWatch Logs subscription payload (base64-gzipped JSON).
 * @param {string} data - base64-encoded gzipped JSON
 * @returns {{ logGroup: string, logStream: string, logEvents: Array<{ id: string, timestamp: number, message: string }> }}
 */
export function decodeLogsData(data) {
  const buf = Buffer.from(data, 'base64');
  const raw = zlib.gunzipSync(buf).toString('utf8');
  return JSON.parse(raw);
}

// --- parse ---

/**
 * Parse a log event message (JSON string). Returns structured fields when possible.
 * Supports: top-level requestId (runtime) and context.aws_request_id (logStructured).
 * @param {string} raw - log line (may be JSON or plain text)
 * @returns {{ requestId?: string, errorType?: string, errorMessage?: string, stackTrace?: string[], message?: string } | null}
 */
export function parseLogMessage(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return null;
    const out = { requestId: p.requestId ?? p.context?.aws_request_id };
    const m = p.message;
    if (m && typeof m === 'object' && ('errorType' in m || 'errorMessage' in m)) {
      out.errorType = m.errorType;
      out.errorMessage = m.errorMessage;
      out.stackTrace = Array.isArray(m.stackTrace) ? m.stackTrace : undefined;
    } else {
      out.message = typeof m === 'string' ? m : (typeof p.message === 'string' ? p.message : raw.slice(0, 500));
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Build structured error events and request metadata from raw log events.
 * @param {Array<{ id: string, timestamp: number, message: string }>} logEvents
 * @returns {{ errorEvents: Array<object>, firstRequestId: string | null, firstTs: number | null }}
 */
export function buildErrorEventsFromLogEvents(logEvents) {
  const errorEvents = [];
  let firstRequestId = null;
  let firstTs = null;

  for (const e of logEvents) {
    const raw = typeof e.message === 'string' ? e.message : String(e.message);
    const parsed = parseLogMessage(raw);
    const base = { id: e.id, ts: e.timestamp };
    if (parsed) {
      if (parsed.requestId) base.requestId = parsed.requestId;
      if (parsed.errorType) base.errorType = parsed.errorType;
      if (parsed.errorMessage) base.errorMessage = parsed.errorMessage;
      if (parsed.stackTrace) base.stackTrace = parsed.stackTrace;
      if (parsed.message) base.message = parsed.message;
      if (parsed.errorMessage && !base.message) base.message = parsed.errorMessage;
    }
    if (!base.message) base.message = raw.slice(0, 500);
    errorEvents.push(base);
    if (!firstRequestId && base.requestId) firstRequestId = base.requestId;
    if (firstTs == null) firstTs = e.timestamp;
  }

  return { errorEvents, firstRequestId, firstTs };
}

/**
 * Fetch request logs from CloudWatch and trim to logs up to (and including) the error.
 * In LOCAL_TEST mode with errorEvents, builds mock request logs from the actual error events
 * so the agent sees the real error (e.g. from run-local payload), not the hardcoded fallback mock.
 * @param {import('@aws-sdk/client-cloudwatch-logs').CloudWatchLogsClient} cw
 * @param {string} logGroup
 * @param {string | null} firstRequestId
 * @param {number | null} firstTs
 * @param {Array<{ ts: number, message?: string, errorType?: string, errorMessage?: string, stackTrace?: string[], requestId?: string }>} errorEvents
 * @returns {Promise<Array<{ ts: number, message: string }>>}
 */
export async function fetchRequestLogsUpToError(cw, logGroup, firstRequestId, firstTs, errorEvents) {
  // Local test: use actual error events so agent prompt matches the payload (e.g. Google Calendar error)
  if (process.env.LOCAL_TEST === 'true' && errorEvents?.length > 0) {
    const requestId = firstRequestId ?? 'local-test-request-id';
    return errorEvents.map((e) => {
      const payload = {
        timestamp: new Date(e.ts).toISOString(),
        requestId: e.requestId ?? requestId,
      };
      if (e.errorType || e.errorMessage) {
        payload.level = 'ERROR';
        payload.message = { errorType: e.errorType, errorMessage: e.errorMessage, stackTrace: e.stackTrace };
      } else {
        payload.message = e.message ?? 'Application error (mock).';
      }
      return { ts: e.ts, message: JSON.stringify(payload) };
    });
  }

  const requestStartTs = firstTs ?? Date.now();
  const requestLogs = await fetchRequestLogs(logGroup, firstRequestId, requestStartTs, cw);
  const maxErrorTs = errorEvents.length ? Math.max(...errorEvents.map((e) => e.ts)) : null;
  return maxErrorTs != null ? requestLogs.filter((r) => r.ts <= maxErrorTs) : requestLogs;
}

// --- fetch ---

/**
 * Fetch all log events for the given requestId from the log group (for AI context).
 * Matches both $.requestId (runtime) and $.context.aws_request_id (logStructured).
 * @param {string} logGroupName
 * @param {string | null} requestId
 * @param {number} aroundTs - timestamp (ms) to define time window
 * @param {import('@aws-sdk/client-cloudwatch-logs').CloudWatchLogsClient} cw
 * @returns {Promise<Array<{ ts: number, message: string }>>}
 */
export async function fetchRequestLogs(logGroupName, requestId, aroundTs, cw) {
  if (!logGroupName || !requestId) return [];
  
  // Local test mode: fallback mock when no error events (e.g. empty payload). Prefer building from
  // actual error events in fetchRequestLogsUpToError so the agent sees the real error.
  if (process.env.LOCAL_TEST === 'true') {
    console.log('[LOCAL_TEST] fetchRequestLogs: returning fallback mock (no error events)');
    return [
      {
        ts: aroundTs - 1000,
        message: JSON.stringify({
          timestamp: new Date(aroundTs - 1000).toISOString(),
          level: 'INFO',
          requestId,
          message: 'Request started',
        }),
      },
      {
        ts: aroundTs,
        message: JSON.stringify({
          timestamp: new Date(aroundTs).toISOString(),
          level: 'ERROR',
          requestId,
          message: 'Application error (mock).',
        }),
      },
    ];
  }
  
  const start = aroundTs - 2 * 60 * 1000; // 2 min before
  const end = aroundTs + 60 * 1000;       // 1 min after
  const byEventId = new Map();
  const run = async (filterPattern) => {
    try {
      const out = await cw.send(new FilterLogEventsCommand({
        logGroupName,
        startTime: start,
        endTime: end,
        filterPattern,
        limit: 200,
      }));
      for (const e of out.events || []) {
        if (e.eventId && !byEventId.has(e.eventId))
          byEventId.set(e.eventId, { ts: e.timestamp, message: e.message || '' });
      }
    } catch (err) {
      console.warn('FilterLogEvents failed:', err.message);
    }
  };
  await run(`{ $.requestId = "${requestId}" }`);
  await run(`{ $.context.aws_request_id = "${requestId}" }`);
  const list = [...byEventId.values()];
  list.sort((a, b) => a.ts - b.ts);
  return list;
}


// normalizeLog.mjs
// Node.js ES Module for normalizing logs

/**
 * Normalize dynamic parts of a log message for deduplication.
 * Replaces timestamps, UUIDs, alphanumeric IDs, numeric values with placeholders.
 *
 * @param {string} rawMessage - Raw log message (string, JSON string, or string+JSON)
 * @returns {string} canonicalMessage - Normalized message
 */
export function normalizeLog(rawMessage) {
  let message = rawMessage;

  // 1. Check if message contains JSON part
  let jsonPart = null;
  let prefix = '';

  // Split on first '{' if string+JSON
  const firstBrace = message.indexOf('{');
  if (firstBrace > 0) {
    prefix = message.slice(0, firstBrace); // e.g., "ERROR:"
    const possibleJson = message.slice(firstBrace);
    try {
      jsonPart = JSON.parse(possibleJson);
    } catch (e) {
      jsonPart = null;
    }
  } else if (message.startsWith('{')) {
    try {
      jsonPart = JSON.parse(message);
    } catch (e) {
      jsonPart = null;
    }
  }

  // 2. Normalize JSON if exists
  if (jsonPart) {
    const normalizedJson = normalizeObject(jsonPart);
    const jsonString = JSON.stringify(normalizedJson);
    return prefix + jsonString;
  }

  // 3. Else normalize plain string
  return normalizeString(message);
}

/**
 * Recursively normalize all values in a JSON object
 */
export function normalizeObject(obj) {
  if (typeof obj === 'string') return normalizeString(obj);
  if (typeof obj === 'number') return '{num}';
  if (Array.isArray(obj)) return obj.map(normalizeObject);
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const key in obj) {
      res[key] = normalizeObject(obj[key]);
    }
    return res;
  }
  return obj; // boolean or null
}

/**
 * Normalize dynamic parts in a string
 * Focus: Replace IDs, timestamps, and numbers so same error patterns hash the same
 */
export function normalizeString(str) {
  let s = str;

  // ISO8601 timestamps: 2026-01-27T01:49:48.224Z
  s = s.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g,
    '{ts}'
  );

  // UUIDs: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  s = s.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    '{uuid}'
  );

  // Long alphanumeric IDs (20+ chars, like "01k6efc1axfm2hcewncbkcbnth")
  // These are typically database IDs, request IDs, etc.
  s = s.replace(/\b[a-zA-Z0-9]{20,}\b/g, '{id}');

  // Medium alphanumeric IDs (12-19 chars) - likely IDs but shorter
  // Only if it starts with a digit or has very few vowels (likely an ID, not a word)
  s = s.replace(/\b([0-9][a-zA-Z0-9]{11,18}|[a-zA-Z0-9]{12,19})\b/g, (match) => {
    // Skip if it looks like a word (has many vowels)
    const vowelCount = (match.match(/[aeiouAEIOU]/g) || []).length;
    if (vowelCount > match.length * 0.25) return match; // More than 25% vowels = likely a word
    return '{id}';
  });

  // Numbers (standalone digits)
  s = s.replace(/\b\d+\b/g, '{num}');

  return s;
}
