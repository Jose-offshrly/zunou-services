/**
 * Comprehensive tests for log normalization.
 * Ensures same error patterns with different dynamic values normalize to the same result.
 */

import { normalizeLog, normalizeString, normalizeObject } from './logs.mjs';

describe('normalizeString', () => {
  test('replaces ISO8601 timestamps', () => {
    expect(normalizeString('Error at 2026-01-27T01:49:48.224Z')).toBe('Error at {ts}');
    expect(normalizeString('Started: 2026-01-27T10:30:00Z ended')).toBe('Started: {ts} ended');
    expect(normalizeString('2026-01-27T01:49:48Z')).toBe('{ts}');
  });

  test('replaces UUIDs', () => {
    expect(normalizeString('Request a1b2c3d4-e5f6-7890-abcd-ef1234567890 failed')).toBe('Request {uuid} failed');
    expect(normalizeString('Transaction ID: A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe('Transaction ID: {uuid}');
  });

  test('replaces long alphanumeric IDs (20+ chars)', () => {
    expect(normalizeString('Meeting ID: 01k6efc1axfm2hcewncbkcbnth')).toBe('Meeting ID: {id}');
    expect(normalizeString('User abc123def456ghi789jkl012mno345pqr678')).toBe('User {id}');
  });

  test('replaces medium alphanumeric IDs (12-19 chars) with low vowel ratio', () => {
    expect(normalizeString('ID: abc123def456')).toBe('ID: {id}');
    expect(normalizeString('Request xyz789ghi012')).toBe('Request {id}');
  });

  test('preserves words with high vowel ratio', () => {
    expect(normalizeString('Error: transaction failed')).toBe('Error: transaction failed');
    expect(normalizeString('Validation error')).toBe('Validation error');
    expect(normalizeString('Connection timeout')).toBe('Connection timeout');
  });

  test('replaces standalone numbers', () => {
    expect(normalizeString('User 12345 failed')).toBe('User {num} failed');
    expect(normalizeString('Count: 42')).toBe('Count: {num}');
    expect(normalizeString('Error code 500')).toBe('Error code {num}');
  });

  test('handles multiple replacements in one string', () => {
    const input = 'User 12345 (ID: 01k6efc1axfm2hcewncbkcbnth) at 2026-01-27T01:49:48Z';
    const expected = 'User {num} (ID: {id}) at {ts}';
    expect(normalizeString(input)).toBe(expected);
  });
});

describe('normalizeObject', () => {
  test('normalizes string values', () => {
    const input = { message: 'Error at 2026-01-27T01:49:48Z' };
    expect(normalizeObject(input)).toEqual({ message: 'Error at {ts}' });
  });

  test('normalizes number values', () => {
    const input = { count: 42, total: 100 };
    expect(normalizeObject(input)).toEqual({ count: '{num}', total: '{num}' });
  });

  test('normalizes nested objects', () => {
    const input = {
      error: 'Meeting not found',
      details: {
        id: '01k6efc1axfm2hcewncbkcbnth',
        timestamp: '2026-01-27T01:49:48Z',
      },
    };
    expect(normalizeObject(input)).toEqual({
      error: 'Meeting not found',
      details: {
        id: '{id}',
        timestamp: '{ts}',
      },
    });
  });

  test('normalizes arrays', () => {
    const input = {
      ids: ['01k6efc1axfm2hcewncbkcbnth', '01k6cvxpjnzkefa1jmw77jyywn'],
      counts: [10, 20, 30],
    };
    expect(normalizeObject(input)).toEqual({
      ids: ['{id}', '{id}'],
      counts: ['{num}', '{num}', '{num}'],
    });
  });

  test('preserves booleans and null', () => {
    const input = { active: true, deleted: false, value: null };
    expect(normalizeObject(input)).toEqual({ active: true, deleted: false, value: null });
  });
});

describe('normalizeLog - Main Use Case', () => {
  // The critical test: same error pattern with different IDs should normalize identically
  const basePattern = `ERROR:{"error":"Meeting not found","message":"No meeting with ID: {id}","timestamp":"{ts}","scheduler":{"status":"healthy","environment":"staging","timestamp":"{ts}","requestedMeetingId":"{id}","communicationMethod":"dynamodb"},"instances":{"active":"{num}","total":"{num}","maxConcurrentPerInstance":"{num}","maxInstancesConfigured":"{num}","source":"scheduler"},"ecs":{"desired":"{num}","running":"{num}","pending":"{num}","serviceName":"meet-bot-staging","clusterName":"primary-staging","status":"ACTIVE"}}`;

  test('normalizes same error pattern with different meeting IDs to identical result', () => {
    const error1 = `ERROR:{"error":"Meeting not found","message":"No meeting with ID: 01k6efc1axfm2hcewncbkcbnth","timestamp":"2026-01-27T01:49:48.224Z","scheduler":{"status":"healthy","environment":"staging","timestamp":"2026-01-27T01:49:48.224Z","requestedMeetingId":"01k6efc1axfm2hcewncbkcbnth","communicationMethod":"dynamodb"},"instances":{"active":0,"total":1732,"maxConcurrentPerInstance":1,"maxInstancesConfigured":2,"source":"scheduler"},"ecs":{"desired":2,"running":2,"pending":0,"serviceName":"meet-bot-staging","clusterName":"primary-staging","status":"ACTIVE"}}`;

    const error2 = `ERROR:{"error":"Meeting not found","message":"No meeting with ID: 01k6cvxpjnzkefa1jmw77jyywn","timestamp":"2026-01-27T01:49:50.500Z","scheduler":{"status":"healthy","environment":"staging","timestamp":"2026-01-27T01:49:50.500Z","requestedMeetingId":"01k6cvxpjnzkefa1jmw77jyywn","communicationMethod":"dynamodb"},"instances":{"active":0,"total":1732,"maxConcurrentPerInstance":1,"maxInstancesConfigured":2,"source":"scheduler"},"ecs":{"desired":2,"running":2,"pending":0,"serviceName":"meet-bot-staging","clusterName":"primary-staging","status":"ACTIVE"}}`;

    const error3 = `ERROR:{"error":"Meeting not found","message":"No meeting with ID: 01k6cw3nx1x4fah5n5v3tnqn8w","timestamp":"2026-01-27T01:49:52.100Z","scheduler":{"status":"healthy","environment":"staging","timestamp":"2026-01-27T01:49:52.100Z","requestedMeetingId":"01k6cw3nx1x4fah5n5v3tnqn8w","communicationMethod":"dynamodb"},"instances":{"active":0,"total":1732,"maxConcurrentPerInstance":1,"maxInstancesConfigured":2,"source":"scheduler"},"ecs":{"desired":2,"running":2,"pending":0,"serviceName":"meet-bot-staging","clusterName":"primary-staging","status":"ACTIVE"}}`;

    const normalized1 = normalizeLog(error1);
    const normalized2 = normalizeLog(error2);
    const normalized3 = normalizeLog(error3);

    expect(normalized1).toBe(normalized2);
    expect(normalized2).toBe(normalized3);
    expect(normalized1).toBe(basePattern);
  });

  test('normalizes same error pattern with different timestamps to identical result', () => {
    const error1 = 'Error occurred at 2026-01-27T01:49:48.224Z';
    const error2 = 'Error occurred at 2026-01-27T01:49:50.500Z';
    const error3 = 'Error occurred at 2026-01-27T01:49:52.100Z';

    const normalized1 = normalizeLog(error1);
    const normalized2 = normalizeLog(error2);
    const normalized3 = normalizeLog(error3);

    expect(normalized1).toBe(normalized2);
    expect(normalized2).toBe(normalized3);
    expect(normalized1).toBe('Error occurred at {ts}');
  });

  test('normalizes same error pattern with different numbers to identical result', () => {
    const error1 = 'User 12345 failed login';
    const error2 = 'User 67890 failed login';
    const error3 = 'User 99999 failed login';

    const normalized1 = normalizeLog(error1);
    const normalized2 = normalizeLog(error2);
    const normalized3 = normalizeLog(error3);

    expect(normalized1).toBe(normalized2);
    expect(normalized2).toBe(normalized3);
    expect(normalized1).toBe('User {num} failed login');
  });
});

describe('normalizeLog - Edge Cases', () => {
  test('handles pure JSON', () => {
    const input = `{"error":"Meeting not found","message":"No meeting with ID: 01k6efc1axfm2hcewncbkcbnth","timestamp":"2026-01-27T01:49:48.224Z"}`;
    const result = normalizeLog(input);
    expect(result).toContain('{id}');
    expect(result).toContain('{ts}');
    expect(result).not.toContain('01k6efc1axfm2hcewncbkcbnth');
    expect(result).not.toContain('2026-01-27T01:49:48.224Z');
  });

  test('handles string prefix + JSON', () => {
    const input = `ERROR:{"error":"Meeting not found","message":"No meeting with ID: 01k6efc1axfm2hcewncbkcbnth"}`;
    const result = normalizeLog(input);
    expect(result.startsWith('ERROR:')).toBe(true);
    expect(result).toContain('{id}');
  });

  test('handles plain string (no JSON)', () => {
    const input = 'Error: Meeting not found with ID 01k6efc1axfm2hcewncbkcbnth';
    const result = normalizeLog(input);
    expect(result).toContain('{id}');
    expect(result).not.toContain('01k6efc1axfm2hcewncbkcbnth');
  });

  test('handles invalid JSON gracefully', () => {
    const input = 'ERROR:{"invalid": json, missing quotes}';
    const result = normalizeLog(input);
    // Should normalize as plain string
    expect(typeof result).toBe('string');
  });

  test('handles empty string', () => {
    expect(normalizeLog('')).toBe('');
  });

  test('handles string with only whitespace', () => {
    expect(normalizeLog('   \n\t  ')).toBe('   \n\t  ');
  });
});

describe('normalizeLog - Different Error Patterns', () => {
  test('different error messages produce different normalized results', () => {
    const error1 = 'Meeting not found';
    const error2 = 'User not found';
    const error3 = 'File not found';

    const normalized1 = normalizeLog(error1);
    const normalized2 = normalizeLog(error2);
    const normalized3 = normalizeLog(error3);

    expect(normalized1).not.toBe(normalized2);
    expect(normalized2).not.toBe(normalized3);
    expect(normalized1).not.toBe(normalized3);
  });

  test('different error types produce different normalized results', () => {
    const error1 = '{"errorType":"NotFoundError","message":"Meeting not found"}';
    const error2 = '{"errorType":"TypeError","message":"Cannot read property"}';
    const error3 = '{"errorType":"ReferenceError","message":"Variable not defined"}';

    const normalized1 = normalizeLog(error1);
    const normalized2 = normalizeLog(error2);
    const normalized3 = normalizeLog(error3);

    expect(normalized1).not.toBe(normalized2);
    expect(normalized2).not.toBe(normalized3);
    expect(normalized1).not.toBe(normalized3);
  });
});

describe('normalizeLog - Real-world Scenarios', () => {
  test('Laravel validation error', () => {
    const input = `{"level":"ERROR","message":"Validation failed for user_id: 12345","errors":{"user_id":["The user_id field is required."]},"timestamp":"2026-01-27T10:30:00.000Z","requestId":"req-abc123xyz"}`;
    const result = normalizeLog(input);
    expect(result).toContain('{num}'); // user_id: 12345
    expect(result).toContain('{ts}'); // timestamp
    expect(result).not.toContain('12345');
    expect(result).not.toContain('2026-01-27T10:30:00.000Z');
  });

  test('Node.js ReferenceError', () => {
    const input = `{"errorType":"ReferenceError","errorMessage":"variableNotDefined is not defined","timestamp":"2026-01-27T10:30:00Z"}`;
    const result = normalizeLog(input);
    expect(result).toContain('{ts}');
    expect(result).not.toContain('2026-01-27T10:30:00Z');
    expect(result).toContain('variableNotDefined is not defined'); // Error message preserved
  });

  test('Multiple timestamps in one message', () => {
    const input = `{"started":"2026-01-27T10:00:00Z","ended":"2026-01-27T10:05:00Z","duration":300000}`;
    const result = normalizeLog(input);
    const tsCount = (result.match(/{ts}/g) || []).length;
    expect(tsCount).toBe(2); // Both timestamps normalized
    expect(result).toContain('{num}'); // duration normalized
  });

  test('Mixed dynamic values', () => {
    const input = `User 12345 (uuid: a1b2c3d4-e5f6-7890-abcd-ef1234567890) accessed /api/users/67890 at 2026-01-27T10:30:00Z`;
    const result = normalizeLog(input);
    expect(result).toContain('{num}'); // User ID
    expect(result).toContain('{uuid}'); // UUID
    expect(result).toContain('{ts}'); // Timestamp
    expect(result).not.toContain('12345');
    expect(result).not.toContain('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(result).not.toContain('2026-01-27T10:30:00Z');
  });
});
