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
import { clearShareToken, getShareToken, redirectAuth } from './utils';
import { redirectToErrorPage } from './errorRedirect';
import { AgentAccessType, ChatStatusType } from '../../app/constants';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { agentConfigInfo } from '@/global/core/user/api';

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
  async function tokenIsValid(agentConfigInfo: agentConfigInfo, tenantId: number) {
    // debugger;
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

      const permissionType = agentConfigInfo.permissionType;
      const agentId = agentConfigInfo.agentId;
      const tenantId = agentConfigInfo.tenantId;

      if (permissionType === AgentAccessType.PUBLIC) {
        setChatStauts(ChatStatusType.CAN_CHAT);
      }

      if (permissionType === AgentAccessType.PRIVATE) {
        await tokenIsValid(agentConfigInfo, tenantId);
        setChatStauts(ChatStatusType.CAN_CHAT);
      }
      if (permissionType === AgentAccessType.FEE_OR_MEMBERSHIP) {
        let { count } = await getRemainingCount({
          openid,
          unionid,
          agentId
        });
        console.log('ccc permissionType count', count);
        let minCount = 1;
        if (process.env.NODE_ENV === 'development') {
          minCount = 130;
          console.warn('ccc permissionType mock minCount', minCount, count);
        }

        if (count < minCount) {
          await tokenIsValid(agentConfigInfo, tenantId);
          const shareToken = getShareToken(agentConfigInfo);
          const { paid, memberLevelOk } = await getAgentPermission({
            agentId,
            shareToken,
            tenantId
          });
          if (paid || memberLevelOk) {
            setChatStauts(ChatStatusType.CAN_CHAT);
          } else {
            setChatStauts(ChatStatusType.DISABLE_CHAT);
          }
        } else {
          setChatStauts(ChatStatusType.CAN_CHAT);
        }
        console.log('ccc permissionType chatStauts', chatStauts);
      }
    },
    {
      manual: false,
      refreshDeps: [appId, openid],
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
