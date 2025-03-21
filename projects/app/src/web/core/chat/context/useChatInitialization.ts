// hooks/useChatInitialization.ts
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getAgentConfigInfo, getStaffInfo } from '@/web/core/chat/user';
import { initWechatShare } from '@/web/core/chat/wechat';
import { share_h5_url, USER_NAME, USER_PWD } from '@/config';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import Cookies from 'js-cookie';
import { clearShareToken, getShareToken, redirectAuth } from './utils';
import { redirectToErrorPage } from './errorRedirect';
import { AgentAccessType } from '../../app/constants';
const useChatInitialization = (appId: string) => {
  const router = useRouter();
  const { setAgentConfigInfo, setStaffInfo, setToken, setCanChat, setShareToken, openid } =
    useChatStore();
  const agentConfigInfo = useChatStore().agentConfigInfo;
  const appKey = agentConfigInfo.appKey;
  const permissionType = agentConfigInfo.permissionType;
  const freeCount = agentConfigInfo.freeCount;
  const tenantId = agentConfigInfo.tenantId;
  const paid = agentConfigInfo.paid;
  const memberLevelOk = agentConfigInfo.memberLevelOk;

  async function tokenIsValid() {
    const shareToken = getShareToken(agentConfigInfo);
    setShareToken(shareToken);
    const staffInfo = await getStaffInfo(shareToken, tenantId);
    setStaffInfo(staffInfo);
  }
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
        if (freeCount < 1) {
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

  useEffect(() => {
    if (!openid || !appKey) return;

    initWechatShare({
      title: agentConfigInfo.name,
      desc: agentConfigInfo.description,
      imgUrl: agentConfigInfo.avatar,
      link: agentConfigInfo.url || `${share_h5_url}/chat?appId=${appId}`
    });
  }, [agentConfigInfo, appId, appKey, openid]);

  return { loading, error };
};

export default useChatInitialization;
