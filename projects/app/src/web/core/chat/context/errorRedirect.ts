// utils/errorRedirect.ts
import { NextRouter } from 'next/router';
export const redirectToErrorPage = (router: NextRouter, error: any) => {
  const errorCode = error?.code || '';
  const errorMessage = encodeURIComponent(error.message || error?.msg || '未知错误');
  const pathname = router.pathname;
  if (pathname !== '/pageError') {
    router.push({
      pathname: '/pageError',
      query: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};
