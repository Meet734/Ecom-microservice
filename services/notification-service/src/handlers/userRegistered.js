import { sendEmail } from '../config/mailer.js';
import { welcomeTemplate } from '../templates/index.js';

export const handleUserRegistered = async (payload) => {
  const { email, name, role } = payload;

  const template = welcomeTemplate({ email, name, role });

  await sendEmail({
    to:      email,
    subject: template.subject,
    html:    template.html,
  });
};
