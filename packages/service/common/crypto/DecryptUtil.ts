import { SM4 } from 'gm-crypto';
import { addLog } from '../system/log';
import { ENV_CONFIG_MAP, EnvConfig } from './envMap';

/**
 * 解密工具类
 * 支持多种解密方式，目前支持SM4
 */
export class DecryptUtil {
  private static instance: DecryptUtil;
  private needEncrypt: boolean;
  private encryptType: string;
  private encryptKey: string;
  private envConfigMap: Record<string, EnvConfig>;

  private constructor() {
    this.needEncrypt = process.env.NEED_ENCRYPT === 'true';
    this.encryptType = process.env.ENCRYPT_TYPE || '';
    this.encryptKey = process.env.ENCRYPT_KEY || '';
    this.envConfigMap = ENV_CONFIG_MAP;

    addLog.info('DecryptUtil initialized', {
      needEncrypt: this.needEncrypt,
      encryptType: this.encryptType,
      configuredEnvs: Object.keys(this.envConfigMap)
    });
  }

  public static getInstance(): DecryptUtil {
    if (!DecryptUtil.instance) {
      DecryptUtil.instance = new DecryptUtil();
    }
    return DecryptUtil.instance;
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据（Base64格式）
   * @param envKey 环境变量键名，用于日志记录
   * @returns 解密后的数据
   */
  public decrypt(encryptedData: string, envKey: string = 'unknown'): string {
    if (!this.needEncrypt) {
      addLog.debug(`跳过解密 [${envKey}]，因为 NEED_ENCRYPT=false`);
      return encryptedData;
    }

    try {
      addLog.info(`开始解密 [${envKey}]`, {
        encryptType: this.encryptType,
        dataLength: encryptedData.length,
        dataSample: encryptedData.substring(0, 10) + '...'
      });

      let result: string;
      switch (this.encryptType) {
        case 'SM4':
          result = this.decryptBySM4(encryptedData, envKey);
          break;
        default:
          addLog.warn(`不支持的加密类型 [${envKey}]: ${this.encryptType}`);
          return encryptedData;
      }

      // 解密成功日志
      addLog.info(`解密成功 [${envKey}]`, {
        originalLength: encryptedData.length,
        resultLength: result.length,
        resultSample: result.length > 10 ? result.substring(0, 10) + '...' : '...'
      });

      return result;
    } catch (error) {
      // 解密失败日志，包含详细错误信息
      addLog.error(`解密失败 [${envKey}]`, {
        error: error instanceof Error ? error.message : String(error),
        encryptedData: encryptedData.substring(0, 20) + '...',
        encryptType: this.encryptType
      });
      return encryptedData;
    }
  }

  /**
   * 使用SM4解密
   * @param encryptedData Base64编码的加密数据
   * @param envKey 环境变量键名，用于日志记录
   * @returns 解密后的数据
   */
  private decryptBySM4(encryptedData: string, envKey: string): string {
    try {
      // 将原始密钥转换为十六进制格式
      const hexKey = Buffer.from(this.encryptKey, 'utf8').toString('hex');
      addLog.debug(`SM4解密密钥 [${envKey}]`, {
        keyLength: hexKey.length,
        keySample: hexKey.substring(0, 8) + '...'
      });

      // 将Base64编码的加密数据转换为Buffer
      const encryptedBuffer = Buffer.from(encryptedData, 'base64');
      addLog.debug(`SM4解密数据转换为Buffer [${envKey}]`, {
        bufferLength: encryptedBuffer.length
      });

      // 使用SM4解密
      const decryptedData = SM4.decrypt(encryptedBuffer, hexKey, {
        mode: SM4.constants.ECB,
        outputEncoding: 'utf8'
      });

      addLog.debug(`SM4解密成功 [${envKey}]`, {
        originalLength: encryptedData.length,
        decryptedLength: decryptedData.length
      });

      return decryptedData;
    } catch (error) {
      addLog.error(`SM4解密错误 [${envKey}]`, {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        encryptedDataLength: encryptedData.length
      });
      throw error;
    }
  }

  /**
   * 获取环境变量值
   * 统一处理加密和非加密情况
   * @param configKey 配置键名，对应ENV_CONFIG_MAP中的键
   * @returns 环境变量值
   */
  public getConfigValue(configKey: string): string | undefined {
    // 获取配置键对应的配置
    const config = this.envConfigMap[configKey];

    // 如果配置不存在，记录警告并返回undefined
    if (!config) {
      addLog.warn(`配置键不存在: ${configKey}`);
      return undefined;
    }

    addLog.info(`获取配置值 [${configKey}]`, {
      description: config.description || '无描述',
      needEncrypt: this.needEncrypt
    });

    // 如果不需要加密，直接返回原始环境变量
    if (!this.needEncrypt) {
      const value = process.env[config.plainKey];
      addLog.debug(`获取非加密环境变量 [${configKey}]`, {
        plainKey: config.plainKey,
        hasValue: !!value
      });
      return value;
    }

    // 需要加密的情况，处理encryptKeys数组
    const parts: string[] = [];
    addLog.debug(`处理加密环境变量 [${configKey}]`, {
      encryptKeys: config.encryptKeys
    });

    // 获取环境变量
    for (const key of config.encryptKeys) {
      const value = process.env[key];

      if (!value) {
        addLog.warn(`环境变量不存在 [${configKey}]: ${key}`);
        continue;
      }

      // 如果以EN_开头，需要解密
      if (key.startsWith('EN_')) {
        addLog.debug(`解密环境变量 [${configKey}]: ${key}`);
        try {
          const decrypted = this.decrypt(value, key);
          parts.push(decrypted);
          addLog.info(`环境变量解密成功 [${configKey}]: ${key}`);
        } catch (error) {
          addLog.error(`环境变量解密失败 [${configKey}]: ${key}`, {
            error: error instanceof Error ? error.message : String(error)
          });
          // 解密失败时，尝试使用原始值
          parts.push(value);
        }
      } else {
        // 否则直接使用
        addLog.debug(`使用非加密环境变量 [${configKey}]: ${key}`);
        parts.push(value);
      }
    }

    // 如果没有有效部分，回退到非加密值
    if (parts.length === 0) {
      addLog.warn(`没有找到有效的加密部分 [${configKey}]，回退到 ${config.plainKey}`);
      return process.env[config.plainKey];
    }

    // 拼接所有部分
    const result = parts.join('');
    addLog.info(`配置值获取成功 [${configKey}]`, {
      partsCount: parts.length,
      resultLength: result.length
    });

    return result;
  }

  /**
   * 获取环境变量值（兼容旧方法）
   * @param key 环境变量名
   * @returns 环境变量值
   */
  public getEnvValue(key: string): string | undefined {
    // 如果是配置的键，使用新方法
    if (this.envConfigMap[key]) {
      return this.getConfigValue(key);
    }

    addLog.debug(`直接获取环境变量 [${key}]`);

    // 否则使用旧方法
    const value = process.env[key];

    if (!value) {
      addLog.warn(`环境变量不存在: ${key}`);
      return undefined;
    }

    // 如果不需要加密或者key不是以EN开头，直接返回
    if (!this.needEncrypt || !key.startsWith('EN_')) {
      addLog.debug(`返回非加密环境变量 [${key}]`);
      return value;
    }

    // 解密
    addLog.debug(`解密环境变量 [${key}]`);
    return this.decrypt(value, key);
  }

  /**
   * 获取所有配置的值
   * 用于调试和日志记录
   * @returns 所有配置的值
   */
  public getAllConfigValues(): Record<string, string | undefined> {
    addLog.info('获取所有配置值', {
      configCount: Object.keys(this.envConfigMap).length
    });

    const result: Record<string, string | undefined> = {};

    for (const key of Object.keys(this.envConfigMap)) {
      result[key] = this.getConfigValue(key);
    }

    return result;
  }
}

// 导出单例实例
export const decryptUtil = DecryptUtil.getInstance();
