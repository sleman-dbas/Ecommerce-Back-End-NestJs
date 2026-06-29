import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  fromName: process.env.GMAIL_FROM_NAME ?? 'Ecommerce Support',
}));
