import { sendEmail } from '../config/mailer.js';
import { orderShippedTemplate } from '../templates/index.js';

export const handleOrderShipped = async (payload) => {
  const { userEmail, orderId, trackingId, estimatedDelivery } = payload;

  const template = orderShippedTemplate({ orderId, trackingId, estimatedDelivery });

  await sendEmail({
    to:      userEmail,
    subject: template.subject,
    html:    template.html,
  });
};