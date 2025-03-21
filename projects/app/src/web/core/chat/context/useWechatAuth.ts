// hooks/useWechatAuth.ts
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { getWechatAuthInfo } from '../user';
import { getWechatAuthCode } from '../user';
import { share_h5_url } from '@/config';
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
  console.log('ddd router', router);
  const { toast } = useToast();
  const { setWechatInfoIds, openid, unionid } = useChatStore();
  useEffect(() => {
    const handleWechatAuth = async () => {
      // 先检查 Cookie 中的 openId 和 unionId
      const openId = openid;
      const unionId = unionid;
      const { code } = router.query;
      if (openId && unionId) {
        console.log('ddd User is already authorized with WeChat.');
        console.log('ddd replace pre url:', window.location.href);
        // 删除 URL 中的 code 和 state 参数，并使用 router.replace
        if (code) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          console.log('ddd replace after url:', url);
          router.replace(url.toString());
        }
        return; // 已经授权，直接返回
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('ddd openId unionId 不存在', openId, unionId);
        return;
      }

      if (pathname === '/pageError') {
        return; // 如果当前路径是错误页面，则不进行微信授权
      }

      if (code) {
        // 已经获取到 code，调用接口获取用户信息
        try {
          const wechatAuthInfo = await getWechatAuthInfo({ code: code as string });
          console.log('ddd wechatAuthInfo', wechatAuthInfo);
          const { openid, unionid, id: wechatInfoId } = wechatAuthInfo;

          // 设置 Cookie，保持 45 天
          Cookies.set('openid', openid, { expires: 45 });
          Cookies.set('unionid', unionid, { expires: 45 });
          Cookies.set('wechatInfoId', wechatInfoId, { expires: 45 });
          setWechatInfoIds({ openid, unionid, wechatInfoId });
          console.log('WeChat authorization successful');
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
          currentUrl = constructNewUrl(window.location.href, share_h5_url);
        } else {
          currentUrl = window.location.href;
        }
        const toAuthUrl = getWechatAuthCode(currentUrl);
        console.log('dddd toAuthUrl', toAuthUrl);
        location.href = toAuthUrl;
      }
    };

    handleWechatAuth();
  }, [router, pathname, toast, unionid, openid, setWechatInfoIds]);
};

export default useWechatAuth;
