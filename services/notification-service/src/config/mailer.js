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
  let configuredSmtpOk = false;

  const transportOptions = {
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000     // 10 seconds
  };

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      ...transportOptions,
      host:   env.SMTP_HOST,
      port:   env.SMTP_PORT,
      secure: env.SMTP_SECURE === 'true',
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      pool:           true,
      maxConnections: 5,
      maxMessages:    100,
    });
    console.log(`[Mailer] Using SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT}`);

    // Verify the connection on startup
    try {
      await transporter.verify();
      console.log('[Mailer] SMTP connection verified ✓');
      configuredSmtpOk = true;
    } catch (err) {
      console.warn('[Mailer] SMTP verify failed. Falling back to Ethereal:', err.message);
    }
  } else {
    console.log('[Mailer] SMTP not fully configured (missing host, user, or pass). Falling back to Ethereal.');
  }

  if (!configuredSmtpOk) {
    try {
      // Auto-create a free Ethereal test account — catches all emails at ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        ...transportOptions,
        host:   'smtp.ethereal.email',
        port:   587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      // Verify Ethereal connection
      await etherealTransporter.verify();
      transporter = etherealTransporter;
      console.log(`[Mailer] Ethereal test inbox configured and verified successfully.`);
      console.log(`[Mailer] View sent emails at: https://ethereal.email/login`);
      console.log(`[Mailer] Ethereal user: ${testAccount.user}`);
      console.log(`[Mailer] Ethereal pass: ${testAccount.pass}`);
    } catch (etherealErr) {
      console.warn('[Mailer] Ethereal verification/creation failed (offline or port 587 blocked). Using stub mailer:', etherealErr.message);
      transporter = {
        sendMail: async (mailOptions) => {
          console.log(`[Mailer Stub] Email simulated to ${mailOptions.to}: Subject="${mailOptions.subject}"`);
          return { messageId: 'stub-id-' + Date.now() };
        }
      };
    }
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) throw new Error('Mailer not initialized — call initMailer() first');

  try {
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
  } catch (err) {
    console.error(`[Mailer] Failed to send email to ${to}:`, err.message);
    // Return mock info instead of throwing to prevent crashing/nacking consumer flows
    return { messageId: 'failed-id-' + Date.now(), error: err.message };
  }
};
