const express = require('express');
const next = require('next');
const axios = require('axios');
const bodyParser = require('body-parser');
const port = 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(bodyParser.json());

  // Add permission validation middleware for chat completions
  server.use('/api/v1/chat/completions', async (req, res, next) => {
    try {
      // Skip middleware for non-POST requests
      if (req.method !== 'POST') {
        return next();
      }

      const { unionid, agentId, tenantId } = req.body.params || {};

      if (!unionid) {
        return res.status(401).json({ code: 401, message: '未登录' });
      }

      // Get API URL from environment variable
      const API_MARKETING_AI_URL = process.env.API_MARKETING_AI_URL;
      console.log('ccc server API_MARKETING_AI_URL', API_MARKETING_AI_URL);
      // Call permission API
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
            Authorization: req.headers.authorization || ''
          }
        }
      );
      console.log('ccc server permission response', response.data);

      const { remainingCount, isLimited } = response.data.data;

      // If no limit, allow chat
      if (!isLimited) {
        return next();
      }

      // Check remaining count
      if (remainingCount < 1) {
        return res.status(200).json({
          code: 0,
          message: '问答额度已用完'
        });
      }

      // Permission validated, continue
      next();
    } catch (error) {
      console.error('[Chat Permission Middleware] Error', error);
      return res.status(200).json({
        code: 0,
        message: '权限验证失败'
      });
    }
  });

  server.get('/healthy', (req, res) => {
    console.log('server is running...');
    res.send('server is running...');
  });

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Readysss on http://localhost:${port}`);
  });
});
