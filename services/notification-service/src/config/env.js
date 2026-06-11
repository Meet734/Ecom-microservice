import { cleanEnv, str, port, email as emailVal } from 'envalid';

const env = cleanEnv(process.env, {
  NODE_ENV:       str({ choices: ['development', 'production', 'test'], default: 'development' }),
  RABBITMQ_URL:   str({ default: 'amqp://guest:guest@localhost:5672' }),

  // SMTP config — use Mailtrap in dev, SES/SendGrid in prod
  SMTP_HOST:      str({ default: 'smtp.mailtrap.io' }),
  SMTP_PORT:      port({ default: 587 }),
  SMTP_USER:      str({ default: '' }),
  SMTP_PASS:      str({ default: '' }),
  EMAIL_FROM:     str({ default: 'noreply@ecommerce.dev' }),
  EMAIL_FROM_NAME: str({ default: 'EcomStore' }),
});

export default env;