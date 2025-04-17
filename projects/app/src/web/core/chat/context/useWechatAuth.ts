// hooks/useWechatAuth.ts
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { getWechatAuthInfo } from '../user';
import { getWechatAuthCode } from '../user';
import { share_h5_url } from '@fastgpt/web/common/system/utils';
import { redirectToErrorPage } from './errorRedirect';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
export type WechatAuthRedirectOptions = {
  url: string;
  useMiniJump?: boolean;
  replace?: boolean;
};

function constructNewUrl(originalUrl: string, newDomain: string) {
  let urlObj = new URL(originalUrl);
  let pathname = urlObj.pathname;
  let search = urlObj.search;
  let newUrl = `${newDomain}/share-agent${pathname}${search}`;
  return newUrl;
}

const useWechatAuth = () => {
  const router = useRouter();
  const pathname = router.pathname;
  const { toast } = useToast();
  const { setWechatInfoIds, openid, unionid } = useChatStore();

  useEffect(() => {
    console.log('ccc request share_h5_url', share_h5_url);
    const handleWechatAuth = async () => {
      const openId = openid;
      const unionId = unionid;
      const { code } = router.query;

      if (openId && unionId) {
        if (code) {
          // 使用 router.replace 替代 window.history.replaceState
          const currentQuery = { ...router.query };
          delete currentQuery.code;
          delete currentQuery.state;
          router.replace(
            {
              pathname: router.pathname,
              query: currentQuery
            },
            undefined,
            { shallow: true }
          );
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('ddd openId unionId 不存在', openId, unionId);
          return;
        }

        if (pathname === '/pageError') {
          return; // 如果当前路径是错误页面，则不进行微信授权
        }

        if (code) {
          try {
            const wechatAuthInfo = await getWechatAuthInfo({ code: code as string });
            const { openid, unionid, id: wechatInfoId } = wechatAuthInfo;

            Cookies.set('openid', openid, { expires: 45 });
            Cookies.set('unionid', unionid, { expires: 45 });
            Cookies.set('wechatInfoId', wechatInfoId, { expires: 45 });
            setWechatInfoIds({ openid, unionid, wechatInfoId });

            // 使用 router.replace 替代 window.history.replaceState
            const currentQuery = { ...router.query };
            delete currentQuery.code;
            delete currentQuery.state;
            await router.replace(
              {
                pathname: router.pathname,
                query: currentQuery
              },
              undefined,
              { shallow: true }
            );
          } catch (error) {
            toast({
              status: 'error',
              title: '微信授权失败'
            });
            console.error('Error during WeChat authorization:', error);
            redirectToErrorPage(router, error);
          }
        } else {
          // 未获取到 code，进行重定向获取 code
          let currentUrl;
          // @ts-ignore
          if (process.env.NODE_ENV === 'development') {
            // @ts-ignore
            currentUrl = constructNewUrl(window.location.href, share_h5_url);
          } else {
            currentUrl = window.location.href;
          }
          const toAuthUrl = getWechatAuthCode(currentUrl);
          console.log('dddd toAuthUrl', toAuthUrl);
          window.location.replace(toAuthUrl);
        }
      }
    };

    handleWechatAuth();
  }, [router, pathname, toast, unionid, openid, setWechatInfoIds]);
};

export default useWechatAuth;
