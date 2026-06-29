import { sendEmail } from '../config/mailer.js';
import { paymentSuccessTemplate } from '../templates/index.js';

export const handlePaymentSuccess = async (payload) => {
  const { orderId, amount, paymentId } = payload;
  const userEmail = payload.email || payload.userEmail || payload.user_email;

  const template = paymentSuccessTemplate({ orderId, amount, paymentId });

  await sendEmail({
    to:      userEmail,
    subject: template.subject,
    html:    template.html,
  });
};