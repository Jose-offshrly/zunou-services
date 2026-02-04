/**
 * Tests for S3-based deduplication.
 */

import { jest } from '@jest/globals';

// Mock AWS SDK before importing deduplication module
const mockSend = jest.fn();
const mockS3Client = {
  send: mockSend,
};

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => mockS3Client),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

const { generateErrorHash, checkDuplicate, markProcessed } = await import('./deduplication.mjs');

describe('generateErrorHash', () => {
  test('generates consistent hash for same error pattern', () => {
    const error1 = { errorType: 'NotFoundError', errorMessage: 'No meeting with ID: 01k6efc1axfm2hcewncbkcbnth' };
    const error2 = { errorType: 'NotFoundError', errorMessage: 'No meeting with ID: 01k6cvxpjnzkefa1jmw77jyywn' };
    const error3 = { errorType: 'NotFoundError', errorMessage: 'No meeting with ID: 01k6cw3nx1x4fah5n5v3tnqn8w' };

    const hash1 = generateErrorHash([error1]);
    const hash2 = generateErrorHash([error2]);
    const hash3 = generateErrorHash([error3]);

    // Same error pattern with different IDs should produce same hash
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
    expect(hash1.length).toBe(64); // SHA256 hex string length
  });

  test('generates different hash for different error patterns', () => {
    const error1 = { errorType: 'NotFoundError', errorMessage: 'Meeting not found' };
    const error2 = { errorType: 'TypeError', errorMessage: 'Cannot read property' };
    const error3 = { errorType: 'ReferenceError', errorMessage: 'Variable not defined' };

    const hash1 = generateErrorHash([error1]);
    const hash2 = generateErrorHash([error2]);
    const hash3 = generateErrorHash([error3]);

    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
    expect(hash1).not.toBe(hash3);
  });

  test('includes all error fields in hash', () => {
    const error1 = { errorType: 'Error', errorMessage: 'Test', message: 'Test message' };
    const error2 = { errorType: 'Error', errorMessage: 'Test' }; // Missing message
    const error3 = { errorType: 'Error', message: 'Test message' }; // Missing errorMessage

    const hash1 = generateErrorHash([error1]);
    const hash2 = generateErrorHash([error2]);
    const hash3 = generateErrorHash([error3]);

    // Different fields should produce different hashes
    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash2).not.toBe(hash3);
  });

  test('handles stack traces', () => {
    const error1 = {
      errorType: 'Error',
      errorMessage: 'Test',
      stackTrace: ['at file.js:1', 'at file.js:2'],
    };
    const error2 = {
      errorType: 'Error',
      errorMessage: 'Test',
      stackTrace: ['at file.js:1', 'at file.js:2'], // Same stack trace
    };
    const error3 = {
      errorType: 'Error',
      errorMessage: 'Test',
      stackTrace: ['at different.js:1', 'at different.js:2'], // Different file names
    };

    const hash1 = generateErrorHash([error1]);
    const hash2 = generateErrorHash([error2]);
    const hash3 = generateErrorHash([error3]);

    expect(hash1).toBe(hash2); // Same stack trace
    expect(hash1).not.toBe(hash3); // Different file names in stack trace
  });

  test('handles multiple error events', () => {
    const errors1 = [
      { errorType: 'Error1', errorMessage: 'Message1' },
      { errorType: 'Error2', errorMessage: 'Message2' },
    ];
    const errors2 = [
      { errorType: 'Error1', errorMessage: 'Message1' },
      { errorType: 'Error2', errorMessage: 'Message2' },
    ];
    const errors3 = [
      { errorType: 'Error1', errorMessage: 'Message1' },
    ];

    const hash1 = generateErrorHash(errors1);
    const hash2 = generateErrorHash(errors2);
    const hash3 = generateErrorHash(errors3);

    expect(hash1).toBe(hash2); // Same errors
    expect(hash1).not.toBe(hash3); // Different number of errors
  });
});

describe('checkDuplicate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
  });

  test('returns false when hash does not exist in S3', async () => {
    process.env.AWS_REGION = 'us-east-1';

    const errorEvents = [{ errorType: 'Error', errorMessage: 'Test' }];

    // Mock GetObjectCommand to return 404 (file doesn't exist)
    mockSend.mockRejectedValueOnce({
      name: 'NoSuchKey',
      $metadata: { httpStatusCode: 404 },
    });

    const result = await checkDuplicate(errorEvents);
    expect(result.isDuplicate).toBe(false);
    expect(result.hash).toBeTruthy();
  });

  test('returns true when hash exists in S3', async () => {
    process.env.AWS_REGION = 'us-east-1';

    const errorEvents = [{ errorType: 'Error', errorMessage: 'Test' }];
    const hash = generateErrorHash(errorEvents);

    // Mock GetObjectCommand to return file with hash
    mockSend.mockResolvedValueOnce({
      Body: {
        transformToString: async () => `${hash}\n`,
      },
    });

    const result = await checkDuplicate(errorEvents);
    expect(result.isDuplicate).toBe(true);
    expect(result.hash).toBe(hash);
  });

  test('fails open on S3 errors', async () => {
    process.env.AWS_REGION = 'us-east-1';

    const errorEvents = [{ errorType: 'Error', errorMessage: 'Test' }];

    // Mock S3 error (not 404)
    mockSend.mockRejectedValueOnce(new Error('S3 service error'));

    const result = await checkDuplicate(errorEvents);
    // Should fail open (allow processing)
    expect(result.isDuplicate).toBe(false);
  });
});

describe('markProcessed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
  });

  test('stores hash in S3 successfully', async () => {
    process.env.AWS_REGION = 'us-east-1';

    const errorEvents = [{ errorType: 'Error', errorMessage: 'Test' }];
    const hash = generateErrorHash(errorEvents);

    // Mock GetObjectCommand (file doesn't exist yet) then PutObjectCommand
    mockSend
      .mockRejectedValueOnce({
        name: 'NoSuchKey',
        $metadata: { httpStatusCode: 404 },
      })
      .mockResolvedValueOnce({}); // PutObjectCommand succeeds

    const result = await markProcessed(errorEvents);
    expect(result).toBe(hash);
    expect(mockSend).toHaveBeenCalledTimes(2); // GetObject + PutObject
  });

  test('fails open on S3 errors', async () => {
    process.env.AWS_REGION = 'us-east-1';

    const errorEvents = [{ errorType: 'Error', errorMessage: 'Test' }];

    // Mock S3 error
    mockSend.mockRejectedValueOnce(new Error('S3 service error'));

    // Should not throw, fail open
    const result = await markProcessed(errorEvents);
    expect(result).toBeTruthy(); // Still returns hash even if storage fails
  });
});

describe('Integration: Real-world deduplication scenario', () => {
  beforeEach(() => {
    process.env.AWS_REGION = 'us-east-1';
    jest.clearAllMocks();
    mockSend.mockClear();
  });

  test('deduplicates same error pattern with different IDs', async () => {
    const error1 = { errorType: 'NotFoundError', errorMessage: 'No meeting with ID: 01k6efc1axfm2hcewncbkcbnth' };
    const error2 = { errorType: 'NotFoundError', errorMessage: 'No meeting with ID: 01k6cvxpjnzkefa1jmw77jyywn' };
    const error3 = { errorType: 'NotFoundError', errorMessage: 'No meeting with ID: 01k6cw3nx1x4fah5n5v3tnqn8w' };

    const hash1 = generateErrorHash([error1]);
    const hash2 = generateErrorHash([error2]);
    const hash3 = generateErrorHash([error3]);

    // All should have same hash (same error pattern)
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);

    // First check - file doesn't exist
    mockSend.mockResolvedValueOnce({
      Body: {
        transformToString: async () => '', // Empty file
      },
    });
    const check1 = await checkDuplicate([error1]);
    expect(check1.isDuplicate).toBe(false);

    // Store first error - file doesn't exist, then write it
    mockSend
      .mockRejectedValueOnce({ name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } })
      .mockResolvedValueOnce({});
    await markProcessed([error1]);

    // Second check - hash exists in file
    mockSend.mockResolvedValueOnce({
      Body: {
        transformToString: async () => `${hash1}\n`,
      },
    });
    const check2 = await checkDuplicate([error2]);
    expect(check2.isDuplicate).toBe(true);
    expect(check2.hash).toBe(hash1);

    // Third check - hash exists in file
    mockSend.mockResolvedValueOnce({
      Body: {
        transformToString: async () => `${hash1}\n`,
      },
    });
    const check3 = await checkDuplicate([error3]);
    expect(check3.isDuplicate).toBe(true);
    expect(check3.hash).toBe(hash1);
  });
});
