import { addLog } from '../system/log';
import { decryptUtil } from './DecryptUtil';

/**
 * 获取配置值
 * @param configKey 配置键名，对应ENV_CONFIG_MAP中的键
 * @returns 配置值
 */
export function getConfigValue(configKey: string): string | undefined {
  return decryptUtil.getConfigValue(configKey);
}

/**
 * 获取环境变量，支持加密（兼容旧方法）
 * @param key 环境变量名
 * @returns 环境变量值
 */
export function getEnvValue(key: string): string | undefined {
  return decryptUtil.getEnvValue(key);
}

/**
 * 打印所有配置值，用于调试
 */
export function logAllConfigValues(): void {
  if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
    addLog.debug('All config values', decryptUtil.getAllConfigValues());
  }
}
