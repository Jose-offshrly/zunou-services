/**
 * Email sending functionality with MailClient interface pattern.
 * Supports multiple drivers (SES, Mailtrap) via MailClient implementations.
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { MailtrapClient } from 'mailtrap';

/**
 * MailClient base class - all email clients must implement the send() method.
 */
export class MailClient {
  async send(params) {
    throw new Error('send() method must be implemented by MailClient subclass');
  }
}

/**
 * AWS SES MailClient implementation.
 */
export class SESMailClient extends MailClient {
  constructor(options = {}) {
    super();
    this.client = new SESClient({
      region: options.region || process.env.AWS_REGION || 'us-east-1',
    });
  }

  async send({ to, from, subject, body, htmlBody, cc, bcc, replyTo }) {
    const toAddresses = Array.isArray(to) ? to : [to];
    const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    const message = {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {},
    };

    if (body) {
      message.Body.Text = { Data: body, Charset: 'UTF-8' };
    }

    if (htmlBody) {
      message.Body.Html = { Data: htmlBody, Charset: 'UTF-8' };
    }

    const destination = { ToAddresses: toAddresses };
    if (ccAddresses) destination.CcAddresses = ccAddresses;
    if (bccAddresses) destination.BccAddresses = bccAddresses;

    const params = {
      Source: from,
      Destination: destination,
      Message: message,
    };

    if (replyTo) {
      params.ReplyToAddresses = Array.isArray(replyTo) ? replyTo : [replyTo];
    }

    try {
      const command = new SendEmailCommand(params);
      const response = await this.client.send(command);
      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      console.error('[Mailer] SES failed:', error);

      if (error.name === 'InvalidClientTokenId' || error.name === 'UnrecognizedClientException') {
        throw new Error(
          `AWS authentication failed: ${error.message}\n` +
          `Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY or run 'aws configure'`
        );
      }

      if (error.name === 'MessageRejected') {
        throw new Error(`Email rejected by SES: ${error.message}. Verify sender email in SES.`);
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

/**
 * Mailtrap MailClient implementation.
 * 
 * Setup: Mailtrap dashboard > Email Sending > Sending Domains
 * - Add and verify domain (DNS records)
 * - Get API token from Integration tab
 * - FROM_EMAIL must be from verified domain
 */
export class MailtrapMailClient extends MailClient {
  constructor(options = {}) {
    super();
    const apiToken = options.apiToken || process.env.MAILTRAP_API_TOKEN;
    if (!apiToken) {
      throw new Error(
        'MAILTRAP_API_TOKEN required. Get from Mailtrap dashboard > Email Sending > Sending Domains > Integration tab'
      );
    }
    this.client = new MailtrapClient({ token: apiToken });
  }

  async send({ to, from, subject, body, htmlBody, cc, bcc, replyTo }) {
    const toAddresses = Array.isArray(to) ? to : [to];
    const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
    const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

    // Parse from field: "Name <email@domain.com>" or just "email@domain.com"
    let sender;
    if (typeof from === 'string') {
      const match = from.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        sender = { name: match[1].trim(), email: match[2].trim() };
      } else {
        sender = { email: from };
      }
    } else {
      sender = from;
    }

    const payload = {
      from: sender,
      to: toAddresses.map(email => ({ email })),
      subject,
    };

    if (body) payload.text = body;
    if (htmlBody) payload.html = htmlBody;
    if (ccAddresses.length > 0) payload.cc = ccAddresses.map(email => ({ email }));
    if (bccAddresses.length > 0) payload.bcc = bccAddresses.map(email => ({ email }));
    if (replyTo) payload.reply_to = Array.isArray(replyTo) ? replyTo[0] : replyTo;

    try {
      const result = await this.client.send(payload);
      return {
        success: true,
        messageId: result.message_ids?.[0] || `mailtrap-${Date.now()}`,
      };
    } catch (error) {
      console.error('[Mailer] Mailtrap failed:', error);

      const errorMessage = error.message || String(error);
      if (errorMessage.includes('Sending from domain is not allowed') ||
          (errorMessage.includes('domain') && errorMessage.includes('not allowed'))) {
        throw new Error(
          `Mailtrap: FROM_EMAIL domain must match verified sending domain. ` +
          `Go to Email Sending > Sending Domains to verify your domain.`
        );
      }

      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }
}

/**
 * Factory function to create MailClient instance.
 * 
 * @param {string} [driver] - 'ses' or 'mailtrap' (defaults to 'ses')
 * @param {Object} [options] - Client-specific options
 * @returns {MailClient}
 */
export function createMailClient(driver, options = {}) {
  const driverName = (driver || getDefaultDriver()).toLowerCase();

  switch (driverName) {
    case 'ses':
      return new SESMailClient(options);
    case 'mailtrap':
      return new MailtrapMailClient(options);
    default:
      throw new Error(`Unknown driver: ${driverName}. Supported: 'ses', 'mailtrap'`);
  }
}

function getDefaultDriver() {
  return 'ses';
}

let defaultMailClient = null;

function getDefaultMailClient() {
  if (!defaultMailClient) {
    defaultMailClient = createMailClient();
  }
  return defaultMailClient;
}

/**
 * Send email using default client.
 */
export async function sendEmail({ to, from = process.env.FROM_EMAIL, subject, body, htmlBody, cc, bcc, replyTo }) {
  if (!to) throw new Error('Recipient email address (to) is required');
  if (!subject) throw new Error('Email subject is required');
  if (!body && !htmlBody) throw new Error('Either body or htmlBody is required');
  if (!from) throw new Error('Sender email address (from) is required. Set FROM_EMAIL env var or pass from parameter');

  const client = getDefaultMailClient();
  return client.send({ to, from, subject, body, htmlBody, cc, bcc, replyTo });
}

/**
 * Send simple text email (convenience function).
 */
export async function sendSimpleEmail(to, subject, body, from) {
  return sendEmail({ to, subject, body, from });
}

/**
 * Send HTML email (convenience function).
 */
export async function sendHtmlEmail(to, subject, htmlBody, textBody, from) {
  return sendEmail({ to, subject, body: textBody, htmlBody, from });
}
