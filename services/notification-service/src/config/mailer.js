import nodemailer from 'nodemailer';
import env from './env.js';

let transporter = null;

/**
 * Build the nodemailer transporter.
 *
 * Strategy:
 *  - If SMTP_HOST is configured → use the provided SMTP credentials (Mailtrap, SES, SendGrid…)
 *  - Otherwise → create an Ethereal test account automatically.
 *    Ethereal is nodemailer's built-in fake inbox: every email is captured at
 *    https://ethereal.email and never actually delivered. Perfect for local dev
 *    with zero configuration.
 */
export const initMailer = async () => {
  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   env.SMTP_PORT,
      secure: env.SMTP_SECURE === 'true',
      auth:   (env.SMTP_USER && env.SMTP_PASS)
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
      pool:           true,
      maxConnections: 5,
      maxMessages:    100,
    });
    console.log(`[Mailer] Using SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
  } else {
    // Auto-create a free Ethereal test account — catches all emails at ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Mailer] No SMTP configured — using Ethereal test inbox`);
    console.log(`[Mailer] View sent emails at: https://ethereal.email/login`);
    console.log(`[Mailer] Ethereal user: ${testAccount.user}`);
    console.log(`[Mailer] Ethereal pass: ${testAccount.pass}`);
  }

  // Verify the connection on startup so we know immediately if SMTP is misconfigured
  try {
    await transporter.verify();
    console.log('[Mailer] SMTP connection verified ✓');
  } catch (err) {
    // Non-fatal — log and continue. Emails may fail at send time.
    console.warn('[Mailer] SMTP verify failed (emails may not send):', err.message);
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) throw new Error('Mailer not initialized — call initMailer() first');

  const info = await transporter.sendMail({
    from:    `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });

  // Ethereal gives a preview URL — very useful in dev
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Mailer] Preview: ${previewUrl}`);
  } else {
    console.log(`[Mailer] Sent to ${to} — messageId: ${info.messageId}`);
  }

  return info;
};
