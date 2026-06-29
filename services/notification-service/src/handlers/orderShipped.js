import { sendEmail } from '../config/mailer.js';
import { orderShippedTemplate } from '../templates/index.js';

export const handleOrderShipped = async (payload) => {
  const { orderId, trackingId, estimatedDelivery } = payload;
  const userEmail = payload.email || payload.userEmail || payload.user_email;

  const template = orderShippedTemplate({ orderId, trackingId, estimatedDelivery });

  await sendEmail({
    to:      userEmail,
    subject: template.subject,
    html:    template.html,
  });
};