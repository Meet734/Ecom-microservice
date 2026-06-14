import { cleanEnv, str, port, num } from 'envalid';

// Note: envalid does not export an `email` validator — use str() for email addresses.

const env = cleanEnv(process.env, {
  NODE_ENV:        str({ choices: ['development', 'production', 'test'], default: 'development' }),
  RABBITMQ_URL:    str({ default: 'amqp://guest:guest@localhost:5672' }),

  // SMTP — use Mailtrap in dev, real provider (SES, SendGrid) in prod.
  // Leave SMTP_USER/SMTP_PASS empty in dev to auto-fall-back to Ethereal.
  SMTP_HOST:       str({ default: '' }),
  SMTP_PORT:       port({ default: 587 }),
  SMTP_SECURE:     str({ choices: ['true', 'false'], default: 'false' }),
  SMTP_USER:       str({ default: '' }),
  SMTP_PASS:       str({ default: '' }),

  EMAIL_FROM:      str({ default: 'noreply@ecommerce.dev' }),
  EMAIL_FROM_NAME: str({ default: 'EcomStore' }),
});

export default env;
