// hooks/useChatInitialization.ts
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getAgentConfigInfo, getStaffInfo } from '@/web/core/chat/user';
import { postLogin } from '@/web/support/user/api';
import { initWechatShare } from '@/web/core/chat/wechat';
import { share_h5_url, USER_NAME, USER_PWD } from '@/config';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useUserStore } from '@/web/support/user/useUserStore';
import Cookies from 'js-cookie';
import { agentConfigInfo } from '@/global/core/user/api';
import { clearShareToken, getShareToken, redirectAuth } from './utils';
const useChatInitialization = (appId: string) => {
  const router = useRouter();
  const { agentConfigInfo, setAgentConfigInfo, setStaffInfo, setToken, setShareToken } =
    useChatStore();
  const { setUserInfo } = useUserStore();

  const { loading, error } = useRequest2(
    async () => {
      if (!appId) {
        throw new Error('No appId provided');
      }

      const agentConfigInfo = await getAgentConfigInfo({ appId });
      setAgentConfigInfo(agentConfigInfo);

      const tenantId = agentConfigInfo.tenantId;
      const nb_fastgpt_token = Cookies.get('nb_fastgpt_token');
      if (nb_fastgpt_token) {
        setToken(nb_fastgpt_token);
      } else {
        const res = await postLogin({ username: USER_NAME, password: USER_PWD });
        if (res?.token) {
          setToken(res.token);
          Cookies.set('nb_fastgpt_token', res.token, { expires: 2, path: '/' });
          if (res?.user) {
            setUserInfo(res.user);
          }
        }
      }

      if (agentConfigInfo.permissionType !== 'PUBLIC') {
        const shareToken = getShareToken(agentConfigInfo);
        setShareToken(shareToken);
        const staffInfo = await getStaffInfo(shareToken, tenantId);
        setStaffInfo(staffInfo);
      }
      //   throw new Error('No error');
    },
    {
      manual: false,
      refreshDeps: [appId],
      onError: (error: any) => {
        console.log('rrr agentConfigInfo', agentConfigInfo);
        const tenantId = agentConfigInfo.tenantId;
        const errorCode = (error as { code?: number }).code;

        if (errorCode === 404) {
          router.push({
            pathname: '/pageError',
            query: {
              code: errorCode || '',
              message: encodeURIComponent(error.message || error.msg || '未知错误')
            }
          });
          return;
        }
        if ([401, 403, 406, 407].includes(errorCode as number)) {
          Cookies.remove('nb_fastgpt_token');
          clearShareToken(agentConfigInfo);
          redirectAuth({ appId, tenantId });
          return;
        }

        router.push({
          pathname: '/pageError',
          query: {
            code: errorCode || '',
            message: encodeURIComponent(error.message || '未知错误')
          }
        });
      }
    }
  );

  useEffect(() => {
    if (!agentConfigInfo.name) return;

    initWechatShare({
      title: agentConfigInfo.name,
      desc: agentConfigInfo.description,
      imgUrl: agentConfigInfo.avatar,
      link: agentConfigInfo.url || `${share_h5_url}/chat?appId=${appId}`
    });
  }, [agentConfigInfo, appId]);

  return { loading, error };
};

export default useChatInitialization;
