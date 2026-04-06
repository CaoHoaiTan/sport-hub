import { Resend } from 'resend';
import { logger } from './logger.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@sporthub.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (!resend) {
    logger.info(
      { to: params.to, subject: params.subject },
      '[Email] RESEND_API_KEY not set — logging email instead of sending'
    );
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (error: unknown) {
    logger.error({ error, to: params.to }, 'Failed to send email');
  }
}

// ─── HTML Templates ──────────────────────────────────────

export function matchReminderHtml(data: {
  matchName: string;
  scheduledAt: string;
  venueName?: string;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Match Reminder</h2>
      <p>Your match <strong>${data.matchName}</strong> is coming up!</p>
      <p><strong>Time:</strong> ${data.scheduledAt}</p>
      ${data.venueName ? `<p><strong>Venue:</strong> ${data.venueName}</p>` : ''}
      <p>Make sure to check in on time.</p>
    </div>
  `;
}

export function matchResultHtml(data: {
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Match Result</h2>
      <p><strong>${data.matchName}</strong></p>
      <p style="font-size: 24px; text-align: center;">
        ${data.homeTeam} <strong>${data.homeScore}</strong> - <strong>${data.awayScore}</strong> ${data.awayTeam}
      </p>
    </div>
  `;
}

export function paymentConfirmationHtml(data: {
  amount: string;
  currency: string;
  tournamentName: string;
  teamName: string;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Confirmed</h2>
      <p>Your payment of <strong>${data.amount} ${data.currency}</strong> for
        <strong>${data.tournamentName}</strong> (team: ${data.teamName}) has been confirmed.</p>
    </div>
  `;
}

export function registrationConfirmationHtml(data: {
  tournamentName: string;
  teamName: string;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Registration Confirmed</h2>
      <p>Your team <strong>${data.teamName}</strong> has been registered for
        <strong>${data.tournamentName}</strong>.</p>
    </div>
  `;
}
