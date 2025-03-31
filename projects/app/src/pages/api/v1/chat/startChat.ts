import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchEventSource } from '@fortaine/fetch-event-source';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getAgentPermission } from '@/service/support/user/permission';
import axios from 'axios';
import { addLog } from '@fastgpt/service/common/system/log';
/**
 * 安全的聊天完成 API 端点
 * 在转发请求前验证用户权限
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    addLog.info(`[startChat handler] ${req.body.params.unionid}`, req.body);
    // 从请求体中提取必要信息
    const bodyData = req.body;

    const { unionid, agentId, tenantId } = bodyData.params;

    // 验证用户权限
    const hasPermission = await validateChatPermission(unionid, agentId, tenantId);

    if (!hasPermission) {
      // if (hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '问答额度已用完'
      });
    }

    await forwardRequest(req, res);
  } catch (error: any) {
    addLog.error(`[startChat handler] ${req.body.params.unionid} error`, error);
    return res.status(500).json({
      code: 500,
      message: error.message || '处理请求时出错'
    });
  }
}

/**
 * 验证用户聊天权限
 */
async function validateChatPermission(
  unionid: string,
  agentId: number,
  tenantId: number
): Promise<boolean> {
  try {
    const permissionRes = await getAgentPermission({
      unionid,
      tenantId,
      agentId
    });
    addLog.info(`[getAgentPermission] ${unionid} ${agentId} ${tenantId}`, permissionRes);

    // 获取剩余次数和限制信息
    const { remainingCount, isLimited } = permissionRes.data;

    // 如果没有限制，允许聊天
    if (!isLimited) {
      return true;
    }

    // 设置最小计数阈值
    let minCount = 1;

    // 检查剩余次数
    return remainingCount >= minCount;
  } catch (error) {
    addLog.error(`[startChat getAgentPermission] ${unionid} ${agentId} ${tenantId}`, error);
    return false;
  }
}

/**
 * 转发请求到原始端点并处理响应
 */
async function forwardRequest(req: NextApiRequest, res: NextApiResponse) {
  const originalUrl = `${process.env.CHAT_STREAM_URL}/api/v1/chat/completions`;
  const isStreamRequest = req.body.stream === true;

  // 准备请求数据
  const requestData = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 转发原始请求的授权头
      ...(req.headers.authorization ? { Authorization: req.headers.authorization as string } : {})
    },
    body: JSON.stringify(req.body)
  };

  if (isStreamRequest) {
    // 处理流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 创建一个 AbortController 用于取消请求
    const controller = new AbortController();

    // 当客户端断开连接时，取消请求
    req.on('close', () => {
      controller.abort();
    });

    try {
      await fetchEventSource(getWebReqUrl(originalUrl), {
        ...requestData,
        signal: controller.signal,
        async onopen(response) {
          if (!response.ok) {
            throw new Error(`Failed to open stream: ${response.status} ${response.statusText}`);
          }
        },
        onmessage(event) {
          // 将事件数据直接转发给客户端
          res.write(`event: ${event.event}\ndata: ${event.data}\n\n`);
        },
        onclose() {
          // 关闭流
          res.end();
        },
        onerror(err) {
          addLog.error(
            `[startChat forwardRequest catch1 Stream error] ${req.body.params.unionid}`,
            {
              err,
              reqBody: req.body
            }
          );
          // 发送错误事件
          res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
          res.end();
        }
      });
    } catch (error) {
      addLog.error(`[startChat forwardRequest catch 2 error] ${req.body.params.unionid}`, {
        error,
        reqBody: req.body
      });
      // 如果还没有结束响应，发送错误
      if (!res.writableEnded) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ message: 'Stream request failed' })}\n\n`
        );
        res.end();
      }
    }
  } else {
    // 处理非流式响应
    try {
      const response = await axios(originalUrl, requestData);
      addLog.info(`[startChat] ${req.body.params.unionid}`, {
        response,
        reqBody: req.body
      });
      // if (!response.ok) {
      //   const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      //   return res.status(response.status).json(errorData);
      // }

      // const data = await response.json();
      // return res.status(200).json(data);
    } catch (error: any) {
      addLog.error(`[startChat] ${req.body.params.unionid}`, {
        error,
        reqBody: req.body
      });
      return res.status(500).json({
        code: 500,
        message: error.message || 'Request failed'
      });
    }
  }
}
