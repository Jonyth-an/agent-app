import { NextRequest, NextResponse } from 'next/server';
import { getWechatAuthCode } from './web/core/chat/user';
import { share_h5_url } from './config';
import { addLog } from '@fastgpt/service/common/system/log';

export async function middleware(request: NextRequest) {
  const { cookies, nextUrl } = request;
  const openid = cookies.get('openid');
  const unionid = cookies.get('unionid');

  // 仅在路径以 /chat 开头时执行中间件逻辑
  if (nextUrl.pathname.startsWith('/chat')) {
    if (!openid || !unionid) {
      // 获取所有查询参数
      const searchParams = new URLSearchParams(nextUrl.search);
      // addLog.info('chat middleware request params', {
      //   data: {
      //     url: request.url,
      //     cookies: request.cookies,
      //     nextUrl: request.nextUrl,
      //     searchParams: searchParams
      //   }
      // });
      // 构建新的 authUrl，包含所有查询参数
      const authUrl = `${share_h5_url}/share-agent/chat?${searchParams.toString()}`;
      const toAuthUrl = getWechatAuthCode(authUrl);
      // addLog.info('chat middleware request toAuthUrl', {
      //   toAuthUrl
      // });
      console.log('chat middleware request toAuthUrl', toAuthUrl);
      return NextResponse.redirect(toAuthUrl);
    }
  }

  return NextResponse.next();
}
