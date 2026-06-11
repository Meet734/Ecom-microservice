import { sendEmail } from '../config/mailer.js';
import { orderConfirmationTemplate } from '../templates/index.js';

export const handleOrderConfirmed = async (payload) => {
  const { userEmail, orderId, items, total, shippingAddress } = payload;

  const template = orderConfirmationTemplate({ orderId, userEmail, items, total, shippingAddress });

  await sendEmail({
    to:      userEmail,
    subject: template.subject,
    html:    template.html,
  });
};