// 导入国际化配置
const { i18n } = require('./next-i18next.config');
const path = require('path');
const fs = require('fs');

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 设置应用的基础路径
  basePath: process.env.NEXT_PUBLIC_BASE_URL,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_URL,
  // 国际化配置
  i18n,
  // 构建输出为独立模式
  output: 'standalone',
  // 严格模式：开发环境关闭，生产环境开启
  reactStrictMode: isDev ? false : true,
  // 启用响应压缩
  compress: true,
  // 配置 API 请求代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://10.5.9.219:3000/api/:path*'
      },
      {
        source: '/uc-system/:path*', // 匹配 /uc-system 及其子路径
        destination: 'https://aim-saas-share-dev.newtamp.cn/uc-system/:path*'
      }
    ];
  },

  // webpack 配置
  webpack(config, { isServer, nextRuntime }) {
    // 禁用一些不需要的模块，优化构建
    Object.assign(config.resolve.alias, {
      '@mongodb-js/zstd': false,
      '@aws-sdk/credential-providers': false,
      snappy: false,
      aws4: false,
      'mongodb-client-encryption': false,
      kerberos: false,
      'supports-color': false,
      'bson-ext': false,
      'pg-native': false
    });

    // 配置模块规则
    config.module = {
      ...config.module,
      rules: config.module.rules.concat([
        // SVG 文件处理
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack']
        },
        // .node 文件处理
        {
          test: /\.node$/,
          use: [{ loader: 'nextjs-node-loader' }]
        }
      ]),
      // 关闭一些 webpack 警告
      exprContextCritical: false,
      unknownContextCritical: false
    };

    // 配置外部依赖
    if (!config.externals) {
      config.externals = [];
    }

    // 服务端特定配置
    if (isServer) {
      if (nextRuntime === 'nodejs') {
        // 扩展入口配置，添加 worker 相关入口
        const oldEntry = config.entry;
        config = {
          ...config,
          async entry(...args) {
            const entries = await oldEntry(...args);
            return {
              ...entries,
              ...getWorkerConfig(),
              // 添加系统插件运行时入口
              'worker/systemPluginRun': path.resolve(
                process.cwd(),
                '../../packages/plugins/runtime/worker.ts'
              )
            };
          }
        };
      }
    } else {
      // 客户端配置：禁用 fs 模块
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false
        }
      };
    }

    // 启用实验性特性
    config.experiments = {
      asyncWebAssembly: true, // 支持异步 WebAssembly
      layers: true // 启用模块层
    };

    return config;
  },

  // 需要转译的包
  transpilePackages: ['@fastgpt/*', 'ahooks'],

  // 实验性功能配置
  experimental: {
    // 优化服务端组件，避免不必要的客户端打包
    serverComponentsExternalPackages: [
      'mongoose',
      'pg',
      '@node-rs/jieba',
      '@zilliz/milvus2-sdk-node'
    ],
    // 设置文件追踪根目录
    outputFileTracingRoot: path.join(__dirname, '../../'),
    // 启用性能检测钩子
    instrumentationHook: true
  }
};

module.exports = nextConfig;

/**
 * 获取 worker 配置
 * 自动扫描 worker 目录，生成入口配置
 */
function getWorkerConfig() {
  // 读取 worker 目录
  const result = fs.readdirSync(path.resolve(__dirname, '../../packages/service/worker'));

  // 获取所有的目录名
  const folderList = result.filter((item) => {
    return fs
      .statSync(path.resolve(__dirname, '../../packages/service/worker', item))
      .isDirectory();
  });

  // 生成 worker 入口配置对象
  /* 
    {
      'worker/htmlStr2Md': '../../packages/service/worker/htmlStr2Md/index.ts',
      'worker/countGptMessagesTokens': '../../packages/service/worker/countGptMessagesTokens/index.ts',
      'worker/readFile': '../../packages/service/worker/readFile/index.ts'
    }
  */
  const workerConfig = folderList.reduce((acc, item) => {
    acc[`worker/${item}`] = path.resolve(
      process.cwd(),
      `../../packages/service/worker/${item}/index.ts`
    );
    return acc;
  }, {});
  return workerConfig;
}
