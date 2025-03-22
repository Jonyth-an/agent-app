import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { wechatMiddleware } from './middleware/wechat';

export async function middleware(request: NextRequest) {
  // 使用更详细的日志
  console.log('xxx middleware triggered for path:', request.nextUrl.pathname);
  console.log('xxx request headers:', request.headers);
  const url = new URL(request.url);
  console.log('xxx full URL:', url.toString());
  // 根据路径匹配不同的中间件
  // if (request.nextUrl.pathname.startsWith('/chat')) {
  //   return wechatMiddleware(request);
  // }

  // 其他中间件...
  // if (request.nextUrl.pathname.startsWith('/other-path')) {
  //   return otherMiddleware(request);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat',
    '/chat/(.*)'
    // 其他需要中间件的路径
  ]
};
