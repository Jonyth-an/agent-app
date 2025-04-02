import { join, resolve } from 'path';
export const APP_PRIFIX = 'share-sandbox/v1';
export const staticPath = join(__dirname, '../../../', 'static');
export const staticPathPrefix = `/${APP_PRIFIX}/static`;
export const logPath = resolve(__dirname, '../../logs');
