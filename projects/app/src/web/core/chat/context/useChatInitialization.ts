import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import {
  getAgentConfigInfo,
  getStaffInfo,
  getWechatAuthInfo,
  getWechatAuthCode,
  getAgentPermission,
  getRemainingCount
} from '@/web/core/chat/user';
import { initWechatShare } from '@/web/core/chat/wechat';
import { share_h5_url } from '@/config';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import Cookies from 'js-cookie';
import { clearShareToken, redirectAuth } from './utils';
import { redirectToErrorPage } from './errorRedirect';
import { AgentAccessType, ChatStatusType } from '../../app/constants';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { agentConfigInfo } from '@/global/core/user/api';
import { hasUserChatPermission } from './chatCheck';

function constructNewUrl(originalUrl: string, newDomain: string) {
  const urlObj = new URL(originalUrl);
  const pathname = urlObj.pathname;
  const search = urlObj.search;
  const newUrl = `${newDomain}/share-agent${pathname}${search}`;
  return newUrl;
}

const useChatInitialization = (appId: string) => {
  const router = useRouter();
  const pathname = router.pathname;
  const { toast } = useToast();
  const {
    setAgentConfigInfo,
    setStaffInfo,
    setToken,
    chatStauts,
    setChatStauts,
    setShareToken,
    setWechatInfoIds,
    openid,
    unionid,
    agentConfigInfo
  } = useChatStore();
  const appKey = agentConfigInfo.appKey;

  // Handle WeChat authentication first
  useEffect(() => {
    const handleWechatAuth = async () => {
      const { code } = router.query;

      if (openid && unionid) {
        if (code) {
          // Clean up URL after successful auth
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
          console.error('ddd openId unionId 不存在', openid, unionid);
          return;
        }

        if (pathname === '/pageError') {
          return; // Skip WeChat auth on error page
        }

        if (code) {
          try {
            const wechatAuthInfo = await getWechatAuthInfo({ code: code as string });
            const { openid, unionid, id: wechatInfoId, nickname, sex } = wechatAuthInfo;

            Cookies.set('openid', openid, { expires: 45 });
            Cookies.set('unionid', unionid, { expires: 45 });
            Cookies.set('wechatInfoId', wechatInfoId, { expires: 45 });
            Cookies.set('nickname', nickname, { expires: 45 });
            setWechatInfoIds({ openid, unionid, wechatInfoId, nickname, sex });

            // Clean up URL after successful auth
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
        }
      }
    };

    handleWechatAuth();
  }, [router, pathname, toast, unionid, openid, setWechatInfoIds, appId]);

  // Check if token is valid

  // Initialize agent configuration after authentication
  const { loading, error } = useRequest2(
    async () => {
      if (!appId || !openid) {
        console.error('appId and openid are required');
        return;
      }

      const agentConfigInfo = await getAgentConfigInfo({ appId }, unionid);
      setAgentConfigInfo(agentConfigInfo);

      const agentId = agentConfigInfo.agentId;
      const tenantId = agentConfigInfo.tenantId;
      const canChat = await hasUserChatPermission({ unionid, agentId, tenantId }, router);
      if (canChat) {
        setChatStauts(ChatStatusType.CAN_CHAT);
      } else {
        setChatStauts(ChatStatusType.DISABLE_CHAT);
      }
    },
    {
      manual: false,
      refreshDeps: [appId, unionid],
      ready: !!appId && !!unionid,
      onError: (error: any) => {
        console.log('ccc useChatInitialization error', error);
        const tenantId = agentConfigInfo.tenantId;
        redirectToErrorPage(router, error);
      }
    }
  );

  // Initialize WeChat sharing

  return { loading, error };
};

export default useChatInitialization;
