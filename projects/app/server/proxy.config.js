// const baseUrl = `http://127.0.0.1:3000`; // 测试
const baseUrl = `http://10.5.9.219:3000`; // 测试
// const baseUrl = `http://10.10.32.252:3000`; // 生产

module.exports = {
  '/api': {
    target: baseUrl + '/api/',
    pathRewrite: { '^/api': '' },
    changeOrigin: true,
    ws: true
    // headers: {
    //   Connection: 'keep-alive',
    //   'Cache-Control': 'no-cache',
    //   Accept: 'text/event-stream'
    // },
    // onProxyRes: function (proxyRes) {
    //   proxyRes.headers['Connection'] = 'keep-alive';
    //   proxyRes.headers['Cache-Control'] = 'no-cache';
    //   proxyRes.headers['Content-Type'] = 'text/event-stream';
    // }
  }
};
