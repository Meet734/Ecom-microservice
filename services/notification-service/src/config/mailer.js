import nodemailer from 'nodemailer';
import env from './env.js';

// Transport is created once and reused — connection pooling
const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,  // true for 465, false for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Pool connections: reuse SMTP connections instead of creating new one per email
  pool:              true,
  maxConnections:    5,
  maxMessages:       100,
  rateDelta:         1000,  // max messages per rateDelta ms
  rateLimit:         5,     // max 5 per second
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from:    `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // strip HTML for text fallback
    });
    console.log(`[Mailer] Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[Mailer] Failed to send email to ${to}:`, err.message);
    throw err;  // Re-throw so consumer nacks the message
  }
};