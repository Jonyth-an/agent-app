const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const next = require('next');
const axios = require('axios');
const path = require('path');
const port = 3000;
const dev = process.env.NODE_ENV !== 'production';
require('dotenv').config();

console.log(
  'ccc cunstom server process.env.NEXT_PUBLIC_BASE_URL',
  process.env.NEXT_PUBLIC_BASE_URL
);
console.log('ccc cunstom server process.env', process.env);
// 定义API前缀
const app = next({
  dev
  // conf: {
  //   basePath: API_PREFIX,
  //   assetPrefix: API_PREFIX
  // }
});
const handle = app.getRequestHandler();

console.log('ccc cunstom server');
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router({
    prefix: process.env.NEXT_PUBLIC_BASE_URL || null
  });

  // 使用bodyParser中间件解析请求体
  server.use(bodyParser());
  console.log('ccc cunstom server run prepare');

  // 添加权限验证中间件
  router.post('/api/v1/chat/completions', async (ctx, next) => {
    try {
      const { unionid, agentId, tenantId } = ctx.request.body.params || {};

      if (!unionid) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未登录' };
        return;
      }

      // 从环境变量获取API URL
      const API_MARKETING_AI_URL = process.env.API_MARKETING_AI_URL;
      console.log('ccc server API_MARKETING_AI_URL', API_MARKETING_AI_URL);
      // 调用权限API
      const response = await axios.get(
        `${API_MARKETING_AI_URL}/marketing-ai/mobile/api/v1/user/agent/permission`,
        {
          params: {
            unionid,
            agentId,
            tenantId
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: ctx.request.headers.authorization || ''
          }
        }
      );
      console.log('ccc server permission response', response.data);

      // const { remainingCount, isLimited } = response.data.data;
      const remainingCount = 0;
      const isLimited = true;
      // 如果没有限制，允许聊天
      if (!isLimited) {
        return await next();
      }

      // 检查剩余次数
      if (remainingCount < 1) {
        ctx.status = 200;
        ctx.body = {
          code: 0,
          message: '问答额度已用完'
        };
        return;
      }

      // 权限验证通过，继续
      await next();
    } catch (error) {
      console.error('[Chat Permission Middleware] Error', error);
      ctx.status = 200;
      ctx.body = {
        code: 0,
        message: '权限验证失败'
      };
    }
  });

  // 健康检查接口
  router.get('/healthy', (ctx) => {
    console.log('server is running...');
    ctx.body = 'server is running...';
  });

  // 注册路由
  server.use(router.routes()).use(router.allowedMethods());

  // 处理所有其他请求，交给Next.js处理
  server.use(async (ctx) => {
    const req = ctx.req;
    const res = ctx.res;

    // Koa不会自动处理响应，需要设置标志告诉Koa不要处理
    ctx.respond = false;
    await handle(req, res);
  });

  // 启动服务器
  server.listen(port, () => {
    console.log(`> Readysss on http://127.0.0.1:${port}`);
  });
});
