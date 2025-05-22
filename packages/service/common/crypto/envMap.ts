/**
 * 环境变量配置项
 */
export interface EnvConfig {
  // 非加密时获取的环境变量
  plainKey: string;
  // 加密时需要获取的环境变量列表，按顺序拼接
  // 如果以EN_开头，则需要解密
  encryptKeys: string[];
  // 描述信息，方便调试
  description?: string;
}

/**
 * 环境变量配置表
 * 统一管理所有需要解密的环境变量
 */
export const ENV_CONFIG_MAP: Record<string, EnvConfig> = {
  // 数据库连接
  MONGODB_URI: {
    plainKey: 'MONGODB_URI',
    encryptKeys: ['EN_MONGODB_URI_BEFORE', 'MONGODB_URI_AFTER'],
    description: 'MongoDB连接URI'
  },
  // PG数据库
  PG_URL: {
    plainKey: 'PG_URL',
    encryptKeys: ['EN_PG_URL'],
    description: 'PostgreSQL连接URL'
  },
  // Token相关
  TOKEN_KEY: {
    plainKey: 'TOKEN_KEY',
    encryptKeys: ['EN_TOKEN_KEY'],
    description: 'API Token密钥'
  },
  FILE_TOKEN_KEY: {
    plainKey: 'FILE_TOKEN_KEY',
    encryptKeys: ['EN_FILE_TOKEN_KEY'],
    description: '文件访问Token密钥'
  }
  // 其他配置可以在这里添加...
};
