// utils/errorRedirect.ts
import { NextRouter } from 'next/router';
export const redirectToErrorPage = (router: NextRouter, error: any) => {
  const errorCode = error?.code || '';
  const errorMessage = encodeURIComponent(error.message || error?.msg || '未知错误');
  const pathname = router.pathname;
  let o = {};
  const isDev = localStorage.getItem('dev') === '12345678';
  const isDebugger = localStorage.getItem('debugger') === 'true';
  console.error(' redirectToErrorPage router', router);
  console.error(' redirectToErrorPage error', error);
  if (isDev) {
    o = { dev: 12345678 };
  }
  if (isDebugger) {
    return;
  }
  if (pathname !== '/pageError') {
    router.push({
      pathname: '/pageError',
      query: {
        code: errorCode,
        message: errorMessage,
        ...o
      }
    });
  }
};
