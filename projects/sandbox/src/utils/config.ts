import { join, resolve } from 'path';
export const APP_PRIFIX = 'share-sandbox/v1';
export const staticPath = join(__dirname, '../../../', 'static');
export const staticPathPrefix = `/${APP_PRIFIX}/static`;
export const logPath = resolve(__dirname, '../../logs');
export const puppeteerOpt = {
  headless: true,
  timeout: 40000,
  ignoreHTTPSErrors: true,
  dumpio: true,
  protocolTimeout: 40000,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--font-render-hinting=medium',
    '--single-process'
  ]
};
