// 导入国际化配置
const { i18n } = require('./next-i18next.config');
const path = require('path');
const fs = require('fs');

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development';
console.log('-----NEXT_PUBLIC_BASE_URL', process.env.NEXT_PUBLIC_BASE_URL);

/**
 * 将 Webpack 配置对象写入文件。
 * @param {Object} config - Webpack 配置对象。
 * @param {boolean} isServer - 是否为服务器端配置。
 */
function writeWebpackConfigToFile(config, isServer) {
  if (!isDev) return;
  // 自定义 replacer 函数，用于将 BigInt 转换为字符串
  const stringifyWithBigIntSupport = (key, value) => {
    return typeof value === 'bigint' ? value.toString() : value;
  };

  // 将配置序列化为字符串，以便可以写入文件
  const configString = JSON.stringify(config, stringifyWithBigIntSupport, 2); // 使用自定义 replacer

  // 定义输出文件路径，根据需要更改
  const outputPath = path.join(
    __dirname,
    isServer ? 'webpack.server.config.json' : 'webpack.client.config.json'
  );

  // 写入文件
  fs.writeFileSync(outputPath, configString, 'utf-8');

  // 打印日志（可选）
  console.log(`Webpack configuration has been written to ${outputPath}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    // 将 build activity 指示器关闭
    autoPrerender: isDev
  },
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
    if (!isDev) {
      return [];
    }
    return [
      {
        source: '/api/v2/chat/completions', // 匹配 /uc-system 及其子路径
        destination: 'http://10.5.9.219:3000/api/v2/chat/completions'
      },
      {
        source: '/localRun/api/:path*', // 匹配 /uc-system 及其子路径
        destination: 'http://10.5.9.219:3000/api/:path*'
      },
      // {
      //   source: '/api/v1/chat/completions', // 匹配 /uc-system 及其子路径
      //   destination: 'http://10.5.9.219:3000/api/v1/chat/completions'
      // },
      {
        source: '/share-sandbox/:path*', // 匹配 /uc-system 及其子路径
        destination: 'http://127.0.0.1:3007/share-sandbox/:path*'
      },
      {
        source: '/uc-system/:path*', // 匹配 /uc-system 及其子路径
        destination: 'https://aim-saas-share-dev.newtamp.cn/uc-system/:path*'
      },
      {
        source: '/marketing/:path*', // 匹配 /uc-system 及其子路径
        destination: 'https://aim-saas-share-dev.newtamp.cn/marketing/:path*'
      },
      {
        source: '/marketing-ai/:path*', // 匹配 /uc-system 及其子路径
        destination: 'https://aim-saas-share-dev.newtamp.cn/marketing-ai/:path*'
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
    // writeWebpackConfigToFile(config, isServer);
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
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '/share-agent'
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
