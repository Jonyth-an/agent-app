import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import {
  getAgentConfigInfo,
  getStaffInfo,
  getWechatAuthInfo,
  getWechatAuthCode
} from '@/web/core/chat/user';
import { initWechatShare } from '@/web/core/chat/wechat';
import { share_h5_url } from '@/config';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import Cookies from 'js-cookie';
import { clearShareToken, getShareToken, redirectAuth } from './utils';
import { redirectToErrorPage } from './errorRedirect';
import { AgentAccessType } from '../../app/constants';
import { useToast } from '@fastgpt/web/hooks/useToast';

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
    setCanChat,
    setShareToken,
    setWechatInfoIds,
    openid,
    unionid,
    agentConfigInfo
  } = useChatStore();

  const appKey = agentConfigInfo.appKey;
  const permissionType = agentConfigInfo.permissionType;
  const freeCount = agentConfigInfo.freeCount;
  const tenantId = agentConfigInfo.tenantId;
  const paid = agentConfigInfo.paid;
  const memberLevelOk = agentConfigInfo.memberLevelOk;

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
            const { openid, unionid, id: wechatInfoId } = wechatAuthInfo;

            Cookies.set('openid', openid, { expires: 45 });
            Cookies.set('unionid', unionid, { expires: 45 });
            Cookies.set('wechatInfoId', wechatInfoId, { expires: 45 });
            setWechatInfoIds({ openid, unionid, wechatInfoId });

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
  async function tokenIsValid() {
    const shareToken = getShareToken(agentConfigInfo);
    setShareToken(shareToken);
    const staffInfo = await getStaffInfo(shareToken, tenantId);
    setStaffInfo(staffInfo);
  }

  // Initialize agent configuration after authentication
  const { loading, error } = useRequest2(
    async () => {
      if (!appId || !openid) {
        console.error('appId and openid are required');
        return;
      }

      const agentConfigInfo = await getAgentConfigInfo({ appId });
      setAgentConfigInfo(agentConfigInfo);

      if (permissionType === AgentAccessType.PUBLIC) {
        setCanChat(true);
      }

      if (permissionType === AgentAccessType.PRIVATE) {
        await tokenIsValid();
        setCanChat(true);
      }

      if (permissionType === AgentAccessType.FEE_OR_MEMBERSHIP) {
        if (freeCount < 5) {
          await tokenIsValid();
          if (paid || memberLevelOk) {
            setCanChat(true);
          } else {
            setCanChat(false);
          }
        } else {
          setCanChat(true);
        }
      }
    },
    {
      manual: false,
      refreshDeps: [appId, openid, appKey],
      ready: !!appId && !!openid,
      onError: (error: any) => {
        console.log('rrr agentConfigInfo', agentConfigInfo);
        const tenantId = agentConfigInfo.tenantId;
        const errorCode = (error as { code?: number }).code;

        if ([401].includes(errorCode as number)) {
          clearShareToken(agentConfigInfo);
          redirectAuth({ appId, tenantId });
          return;
        }
        redirectToErrorPage(router, error);
      }
    }
  );

  // Initialize WeChat sharing
  useEffect(() => {
    if (!openid || !appKey) return;

    initWechatShare({
      title: agentConfigInfo.name,
      desc: agentConfigInfo.description,
      imgUrl: agentConfigInfo.avatar,
      link: agentConfigInfo.url || `${share_h5_url}/share-agent/chat?appId=${appId}`
    });
  }, [agentConfigInfo, appId, appKey, openid]);

  return { loading, error };
};

export default useChatInitialization;
