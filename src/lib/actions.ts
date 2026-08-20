
'use server';

/**
 * @fileOverview Application server actions using Resend for email delivery.
 * 
 * - sendEmailNotification: Sends a direct email to a specific user.
 * - sendBulkEmailNotification: Broadcasts a message to all users.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a real email notification to a single user using Resend.
 */
export async function sendEmailNotification(email: string, subject: string, message: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.warn('[SIMULATION] No Resend API Key found. Message logged to console.');
    console.log(`To: ${email}\nSubject: ${subject}\nMessage: ${message}`);
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'MED-X Support <onboarding@resend.dev>',
      to: email,
      subject: subject,
      text: message,
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    console.log('Email sent successfully:', data?.id);
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
}

/**
 * Sends real email notifications to multiple users using Resend.
 */
export async function sendBulkEmailNotification(emails: string[], subject: string, message: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.warn('[SIMULATION] No Resend API Key found. Bulk message logged to console.');
    console.log(`Broadcasting to ${emails.length} recipients: [${subject}]`);
    return true;
  }

  try {
    const batch = emails.map(email => ({
      from: 'MED-X Broadcast <onboarding@resend.dev>',
      to: email,
      subject: subject,
      text: message,
    }));

    const { data, error } = await resend.batch.send(batch);

    if (error) {
      console.error('Resend Bulk Error:', error);
      return false;
    }

    console.log(`Bulk broadcast successful. Sent ${batch.length} emails.`);
    return true;
  } catch (err) {
    console.error('Failed to send bulk emails:', err);
    return false;
  }
}
