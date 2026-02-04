/**
 * Log deduplication using normalized log hashing with S3 storage.
 * Normalizes error logs (replaces dynamic values) and stores hashes in S3 to detect duplicates.
 * Uses weekly hash files (one file per week containing all hashes).
 */

import crypto from 'crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { normalizeLog } from './logs.mjs';

const DEDUP_BUCKET = 'pulse-lambda-code';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Generate a hash from normalized error log.
 * @param {Array<object>} errorEvents - Parsed error events
 * @returns {string} Hash of normalized error signature
 */
export function generateErrorHash(errorEvents) {
  // Normalize each error event and combine into a signature
  const normalizedErrors = errorEvents.map((e) => {
    const parts = [];
    if (e.errorType) parts.push(`Type:${e.errorType}`);
    if (e.errorMessage) parts.push(`Message:${normalizeLog(e.errorMessage)}`);
    if (e.message) parts.push(`Msg:${normalizeLog(e.message)}`);
    if (e.stackTrace) {
      const stack = Array.isArray(e.stackTrace) ? e.stackTrace.join('\n') : String(e.stackTrace);
      parts.push(`Stack:${normalizeLog(stack)}`);
    }
    return parts.join('|');
  });

  const signature = normalizedErrors.join('||');
  return crypto.createHash('sha256').update(signature).digest('hex');
}

/**
 * Get week identifier (YYYY-WW format) for partitioning hash files.
 * @param {Date} date - Date to get week for (defaults to now)
 * @returns {string} Week identifier (e.g., "2026-04")
 */
function getWeekId(date = new Date()) {
  const year = date.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const daysSinceStart = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getUTCDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Get S3 key for weekly hash file.
 * @param {string} weekId - Week identifier (YYYY-WW format)
 * @returns {string} S3 key path
 */
function getS3Key(weekId) {
  return `error-hashes/${weekId}.txt`;
}

/**
 * Get S3 bucket name from environment.
 * @returns {string} S3 bucket name
 */
/**
 * Load hashes from weekly S3 file.
 * @param {string} weekId - Week identifier
 * @returns {Promise<Set<string>>} Set of hashes
 */
async function loadHashesFromS3(weekId) {
  const key = getS3Key(weekId);

  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: DEDUP_BUCKET, Key: key }));
    const body = await response.Body.transformToString();
    const hashes = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return new Set(hashes);
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return new Set(); // File doesn't exist yet, no hashes
    }
    // On other errors, log and allow processing (fail open)
    console.warn(`Failed to load hashes from S3: ${err.message}`);
    return new Set();
  }
}

/**
 * Append hash to weekly S3 file.
 * @param {string} weekId - Week identifier
 * @param {string} hash - Hash to append
 * @returns {Promise<void>}
 */
async function appendHashToS3(weekId, hash) {
  const key = getS3Key(weekId);

  try {
    // Try to get existing file
    let existingHashes = new Set();
    try {
      const response = await s3Client.send(new GetObjectCommand({ Bucket: DEDUP_BUCKET, Key: key }));
      const body = await response.Body.transformToString();
      existingHashes = new Set(
        body
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      );
    } catch (err) {
      // File doesn't exist yet, start with empty set
      if (err.name !== 'NoSuchKey' && err.$metadata?.httpStatusCode !== 404) {
        throw err; // Re-throw if it's a different error
      }
    }

    // Add new hash if not already present
    if (!existingHashes.has(hash)) {
      existingHashes.add(hash);
      const content = Array.from(existingHashes).sort().join('\n') + '\n';
      await s3Client.send(
        new PutObjectCommand({
          Bucket: DEDUP_BUCKET,
          Key: key,
          Body: content,
          ContentType: 'text/plain',
        })
      );
    }
  } catch (err) {
    console.warn(`Failed to store hash in S3: ${err.message}`);
    // Fail open - don't throw, allow processing to continue
  }
}

/**
 * Check if error has already been processed.
 * @param {Array<object>} errorEvents - Parsed error events
 * @returns {Promise<{ isDuplicate: boolean, hash: string }>}
 */
export async function checkDuplicate(errorEvents) {
  console.log('[checkDuplicate] Checking duplicate...');
  const hash = generateErrorHash(errorEvents);
  const weekId = getWeekId();
  const hashes = await loadHashesFromS3(weekId);
  const isDuplicate = hashes.has(hash);
  console.log('[checkDuplicate]', isDuplicate ? 'duplicate' : 'new');
  return { isDuplicate, hash };
}

/**
 * Mark error as processed (append hash to weekly S3 file).
 * @param {Array<object>} errorEvents - Parsed error events
 * @returns {Promise<string>} Hash that was stored
 */
export async function markProcessed(errorEvents) {
  console.log('[markProcessed] Marking as processed...');
  const hash = generateErrorHash(errorEvents);
  const weekId = getWeekId();
  await appendHashToS3(weekId, hash);
  console.log('[markProcessed] Done');
  return hash;
}
