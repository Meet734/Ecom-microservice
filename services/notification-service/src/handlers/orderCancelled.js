import { sendEmail } from '../config/mailer.js';
import { orderCancelledTemplate } from '../templates/index.js';

export const handleOrderCancelled = async (payload) => {
  const { userEmail, orderId, items, total, cancelledReason } = payload;

  const template = orderCancelledTemplate({ orderId, userEmail, items, total, cancelledReason });

  await sendEmail({
    to:      userEmail,
    subject: template.subject,
    html:    template.html,
  });
};
