import { sendEmail } from '../config/mailer.js';
import { orderCancelledTemplate } from '../templates/index.js';

export const handleOrderCancelled = async (payload) => {
  const { orderId, items, total, cancelledReason } = payload;
  const userEmail = payload.email || payload.userEmail || payload.user_email;

  const template = orderCancelledTemplate({ orderId, userEmail, items, total, cancelledReason });

  await sendEmail({
    to:      userEmail,
    subject: template.subject,
    html:    template.html,
  });
};
