import dotenv from 'dotenv';
dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

export const urlConfig = {
  // Domain for deployed applications
  domain: process.env.DOMAIN || (isDev ? 'localhost:3000' : 'code2cloud.lakshman.me'),
  
  // Backend API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || (isDev ? 'http://localhost:3001' : 'https://api.code2cloud.lakshman.me'),
  
  // Frontend Application URL (for redirects/OAuth)
  appUrl: process.env.NEXT_PUBLIC_APP_URL || (isDev ? 'http://localhost:3000' : 'https://code2cloud.lakshman.me'),

  deploy_domain: process.env.DEPLOY_DOMAIN || (isDev ? 'localhost' : 'preview.code2cloud.lakshman.me'),
  
} as const;