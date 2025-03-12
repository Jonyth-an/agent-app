const express = require('express');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const port = 3000;
// 判断是否为开发环境
const dev = process.env.NODE_ENV !== 'production';
// 初始化 app
const app = next({ dev });
const handle = app.getRequestHandler();
console.log('-----------server---------');
// 代理配置表，这里和一般的 webpack 配置是一样的。
const proxyTable = require('./proxy.config.js');
// const proxyTable = {
//   '/uaa/oauth': {
//     target: 'http://10.0.2.66:8603',
//     pathRewrite: {
//       '^/uaa/oauth': '/uaa/oauth'
//     },
//     changeOrigin: true
//   }
// }

app
  .prepare()
  .then(() => {
    const server = express();

    // 如果是开发环境，则代理接口
    Object.keys(proxyTable).forEach((key) => {
      server.use(key, createProxyMiddleware(proxyTable[key]));
    });

    // 托管所有请求
    server.all('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port} 或 http://127.0.0.1:${port}`);
    });
  })
  .catch((err) => {
    console.log('Error:::::', err);
  });
