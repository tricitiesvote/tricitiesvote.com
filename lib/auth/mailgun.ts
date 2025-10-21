import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData);

const domain = process.env.MAILGUN_DOMAIN || '';

let cachedClient: ReturnType<typeof mailgun.client> | null = null;

function resolveBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://tricitiesvote.com';
  }

  return 'http://localhost:3000';
}

function getMailgunClient() {
  const key = process.env.MAILGUN_API_KEY ?? process.env.MAILGUN_KEY;
  const url = process.env.MAILGUN_URL || 'https://api.mailgun.net';

  if (!key || !domain) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = mailgun.client({
      username: 'api',
      key,
      url
    });
  }

  return cachedClient;
}

function isConfigured() {
  return Boolean(getMailgunClient());
}

export async function sendMagicLink(email: string, token: string) {
  if (!isConfigured()) {
    console.warn('Mailgun not configured; skipping magic link email.', { email });
    return null;
  }

  const baseUrl = resolveBaseUrl();
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

  const messageData = {
    from: process.env.MAILGUN_FROM || 'Tri-Cities Vote <noreply@tricitiesvote.com>',
    to: email,
    subject: 'Sign in to Tri-Cities Vote',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Sign in to Tri-Cities Vote</h2>
        <p style="color: #666; font-size: 16px;">Click the button below to sign in to your account:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}"
             style="background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Sign In to Tri-Cities Vote
          </a>
        </div>

        <p style="color: #999; font-size: 14px;">This link will expire in 15 minutes.</p>
        <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Tri-Cities Vote - Nonpartisan election information for the Tri-Cities area
        </p>
      </div>
    `,
    text: `
      Sign in to Tri-Cities Vote

      Click this link to sign in: ${magicLink}

      This link will expire in 15 minutes.
      If you didn't request this, you can safely ignore this email.

      ---
      Tri-Cities Vote - Nonpartisan election information for the Tri-Cities area
    `,
  };

  const client = getMailgunClient();
  if (!client) {
    console.warn('Mailgun not configured; skipping magic link email.', { email });
    return null;
  }

  try {
    const result = await client.messages.create(domain, messageData);
    console.log('Magic link email sent:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    throw error;
  }
}

export async function sendEditNotification(moderatorEmail: string, editCount: number) {
  if (!isConfigured()) {
    console.warn('Mailgun not configured; skipping edit notification.', { moderatorEmail, editCount });
    return null;
  }

  const baseUrl = resolveBaseUrl();
  const moderationUrl = `${baseUrl}/moderate`;

  const messageData = {
    from: process.env.MAILGUN_FROM || 'Tri-Cities Vote <noreply@tricitiesvote.com>',
    to: moderatorEmail,
    subject: `${editCount} new edit${editCount > 1 ? 's' : ''} pending review`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New edits pending review</h2>
        <p style="color: #666; font-size: 16px;">
          There ${editCount === 1 ? 'is' : 'are'} <strong>${editCount}</strong> new edit${editCount > 1 ? 's' : ''} waiting for moderator review.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${moderationUrl}"
             style="background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Review Edits
          </a>
        </div>

        <p style="color: #999; font-size: 14px;">
          Thank you for helping maintain the quality of our election information.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Tri-Cities Vote - Nonpartisan election information for the Tri-Cities area
        </p>
      </div>
    `,
    text: `
      New edits pending review

      There ${editCount === 1 ? 'is' : 'are'} ${editCount} new edit${editCount > 1 ? 's' : ''} waiting for moderator review.

      Review them at: ${moderationUrl}

      Thank you for helping maintain the quality of our election information.

      ---
      Tri-Cities Vote - Nonpartisan election information for the Tri-Cities area
    `,
  };

  const client = getMailgunClient();
  if (!client) {
    console.warn('Mailgun not configured; skipping edit notification.', { moderatorEmail, editCount });
    return null;
  }

  try {
    const result = await client.messages.create(domain, messageData);
    console.log('Moderator notification sent:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send moderator notification:', error);
    throw error;
  }
}

export async function sendEditStatusNotification(
  userEmail: string,
  status: 'approved' | 'rejected',
  field: string,
  moderatorNote?: string
) {
  if (!isConfigured()) {
    console.warn('Mailgun not configured; skipping edit status notification.', {
      userEmail,
      status,
      field
    });
    return null;
  }

  const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
  const statusIcon = status === 'approved' ? '✅' : '❌';
  const baseUrl = resolveBaseUrl();

  const messageData = {
    from: process.env.MAILGUN_FROM || 'Tri-Cities Vote <noreply@tricitiesvote.com>',
    to: userEmail,
    subject: `Your edit was ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">${statusIcon} Edit ${status}</h2>
        <p style="color: #666; font-size: 16px;">
          Your edit to the <strong>"${field}"</strong> field has been <strong>${status}</strong>.
        </p>

        ${moderatorNote ? `
          <div style="background-color: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Moderator note:</h4>
            <p style="margin: 0; color: #666;">${moderatorNote}</p>
          </div>
        ` : ''}

        <p style="color: #666; font-size: 16px;">
          Thank you for contributing to Tri-Cities Vote! Your efforts help provide accurate, nonpartisan election information to our community.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/edits"
             style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View Edit History
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Tri-Cities Vote - Nonpartisan election information for the Tri-Cities area
        </p>
      </div>
    `,
    text: `
      Edit ${status}

      Your edit to the "${field}" field has been ${status}.
      ${moderatorNote ? `\nModerator note: ${moderatorNote}` : ''}

      Thank you for contributing to Tri-Cities Vote! Your efforts help provide accurate, nonpartisan election information to our community.

      View your edit history at: ${baseUrl}/edits

      ---
      Tri-Cities Vote - Nonpartisan election information for the Tri-Cities area
    `,
  };

  const client = getMailgunClient();
  if (!client) {
    console.warn('Mailgun not configured; skipping edit status notification.', {
      userEmail,
      status,
      field
    });
    return null;
  }

  try {
    const result = await client.messages.create(domain, messageData);
    console.log('Edit status notification sent:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send edit status notification:', error);
    throw error;
  }
}
