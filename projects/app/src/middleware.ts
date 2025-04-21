import { NextRequest, NextResponse } from 'next/server';
import { getWechatAuthCode } from './web/core/chat/user';
import { share_h5_url } from '@fastgpt/web/common/system/utils';
import { API_MARKETING_AI_URL } from '@fastgpt/service/common/system/tools';

export async function middleware(request: NextRequest) {
  const { cookies, nextUrl } = request;
  const openid = cookies.get('openid');
  const unionid = cookies.get('unionid');

  // if (nextUrl.pathname === '/api/v1/chat/completions') {
  //   try {
  //     // 使用原生 Request 对象
  //     const body = await request.json();
  //     const { agentId, tenantId, unionid } = body.params || {};

  //     const response = await fetch(
  //       `${API_MARKETING_AI_URL}/marketing-ai/mobile/api/v1/user/agent/permission?unionid=${unionid}&agentId=${agentId}&tenantId=${tenantId}`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: request.headers.get('Authorization') || ''
  //         }
  //       }
  //     );

  //     if (!response.ok) {
  //       console.error('[Chat Permission Middleware] Permission API error', {
  //         status: response.status,
  //         statusText: response.statusText
  //       });
  //       return NextResponse.json({ code: 0, message: '权限验证失败' }, { status: 200 });
  //     }

  //     const data = await response.json();
  //     console.log('[Chat Permission Middleware] data', data);
  //     const { remainingCount, isLimited } = data.data;

  //     // 如果没有限制，允许聊天
  //     if (!isLimited) {
  //       return NextResponse.next();
  //     }

  //     // 检查剩余次数
  //     if (remainingCount < 1) {
  //       return NextResponse.json(
  //         {
  //           code: 403,
  //           message: '问答额度已用完'
  //         },
  //         { status: 403 }
  //       );
  //     }

  //     // 权限验证通过，继续请求
  //     return NextResponse.next();
  //   } catch (error) {
  //     console.error('[Chat Permission Middleware] Error', error);
  //     return NextResponse.json(
  //       {
  //         code: 0,
  //         message: '权限验证失败'
  //       },
  //       { status: 200 }
  //     );
  //   }
  // }

  // 仅在路径以 /chat 开头时执行中间件逻辑
  if (nextUrl.pathname.startsWith('/chat')) {
    const searchParams = new URLSearchParams(nextUrl.search);
    if (searchParams.has('code')) {
      return NextResponse.next();
    }
    if (!openid || !unionid) {
      const authUrl = `${share_h5_url}/share-agent/chat?${searchParams.toString()}`;
      const toAuthUrl = getWechatAuthCode(authUrl);
      console.log('chat middleware request toAuthUrl', toAuthUrl);
      return NextResponse.redirect(toAuthUrl);
    }
  }

  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  matcher: ['/chat/:path*', '/api/v1/chat/completions', '/api/v2/chat/completions']
};
