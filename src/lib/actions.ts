'use server';

/**
 * @fileOverview Application server actions.
 * 
 * NOTE: The email functions below are currently SIMULATIONS. 
 * To enable real email delivery, you must integrate a provider like Resend or SendGrid
 * using your own API keys.
 */

/**
 * Simulates sending an email notification to a single user.
 */
export async function sendEmailNotification(email: string, subject: string, message: string): Promise<boolean> {
  // MOCK LOGIC: In production, replace this with a real provider (e.g., Resend).
  console.log(`[SIMULATION] Sending email to ${email}: [${subject}] ${message}`);
  
  // Simulate network delay
  return new Promise((res) => setTimeout(() => res(true), 1200));
}

/**
 * Simulates sending an email notification to multiple users.
 */
export async function sendBulkEmailNotification(emails: string[], subject: string, message: string): Promise<boolean> {
  // MOCK LOGIC: In production, replace this with a real provider.
  console.log(`[SIMULATION] Broadcasting email to ${emails.length} recipients: [${subject}]`);
  
  // Simulate network delay for bulk operation
  return new Promise((res) => setTimeout(() => res(true), 2500));
}
