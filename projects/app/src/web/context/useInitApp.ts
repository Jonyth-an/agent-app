import { useCallback, useEffect, useState } from 'react';
import { clientInitData } from '@/web/common/system/staticData';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import type { FastGPTFeConfigsType } from '@fastgpt/global/common/system/types/index.d';
import { useMemoizedFn, useMount } from 'ahooks';
import { TrackEventName } from '../common/system/constants';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '../support/user/useUserStore';
import { useChatStore } from '../core/chat/context/useChatStore';
import { isMiniProgram } from '../core/chat/context/utils';
import { RunPlatformEnum } from '@fastgpt/global/core/chat/constants';

export const useInitApp = () => {
  const router = useRouter();
  const { hiId, bd_vid, k, sourceDomain } = router.query as {
    hiId?: string;
    bd_vid?: string;
    k?: string;
    sourceDomain?: string;
  };
  const { loadGitStar, setInitd, feConfigs } = useSystemStore();
  const { userInfo } = useUserStore();
  const { chatId, setRunPlatform, runPlatform, agentConfigInfo } = useChatStore();
  const [scripts, setScripts] = useState<FastGPTFeConfigsType['scripts']>([]);
  const [title, setTitle] = useState(process.env.SYSTEM_NAME || '');

  const initFetch = useMemoizedFn(async () => {
    const {
      feConfigs: { scripts, isPlus, systemTitle }
    } = await clientInitData();

    setTitle(systemTitle || '');

    // log fastgpt
    if (!isPlus) {
      console.log(
        '%cWelcome to FastGPT',
        'font-family:Arial; color:#3370ff ; font-size:18px; font-weight:bold;',
        `GitHub：https://github.com/labring/FastGPT`
      );
    }

    // loadGitStar();

    setScripts(scripts || []);
    setInitd();
  });

  useMount(() => {
    const errorTrack = (event: ErrorEvent) => {
      window.umami?.track(TrackEventName.windowError, {
        device: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          appName: navigator.appName
        },
        error: event,
        url: location.href
      });
    };
    // add window error track
    window.addEventListener('error', errorTrack);

    return () => {
      window.removeEventListener('error', errorTrack);
    };
  });

  useRequest2(initFetch, {
    refreshDeps: [userInfo?.username, chatId],
    manual: false,
    pollingInterval: 300000 // 5 minutes refresh
  });

  const sendMessageToMiniProgram = useCallback(() => {
    if (typeof window !== 'undefined' && window.wx && window.wx.miniProgram) {
      try {
        const dialog_share_params = {
          title: agentConfigInfo.name,
          desc: agentConfigInfo.description,
          imgUrl: agentConfigInfo.avatar,
          url: agentConfigInfo.url
        };
        console.log('ccc 向小程序发送消息 , dialog_share_params', dialog_share_params);
        // 向小程序发送消息
        window.wx.miniProgram.postMessage({
          data: dialog_share_params
        });
      } catch (error) {
        console.error('ccc 向小程序发送消息失败', error);
      }
    }
  }, [agentConfigInfo]);

  useEffect(() => {
    const bool = isMiniProgram();
    if (bool) {
      setRunPlatform(RunPlatformEnum.MINI_PROGRAM);
      // 页面加载完成后向小程序发送消息
      if (document.readyState === 'complete') {
        sendMessageToMiniProgram();
      } else {
        window.addEventListener('load', sendMessageToMiniProgram);
        return () => {
          window.removeEventListener('load', sendMessageToMiniProgram);
        };
      }
    } else {
      setRunPlatform(RunPlatformEnum.H5);
    }
    console.log('ccc runPlatform', runPlatform);

    hiId && localStorage.setItem('inviterId', hiId);
    bd_vid && sessionStorage.setItem('bd_vid', bd_vid);
    k && sessionStorage.setItem('fastgpt_sem', JSON.stringify({ keyword: k }));

    const formatSourceDomain = (() => {
      if (sourceDomain) return sourceDomain;
      return document.referrer;
    })();

    if (formatSourceDomain && !sessionStorage.getItem('sourceDomain')) {
      sessionStorage.setItem('sourceDomain', formatSourceDomain);
    }
  }, [bd_vid, hiId, k, sourceDomain, runPlatform, setRunPlatform, sendMessageToMiniProgram]);

  return {
    feConfigs,
    scripts,
    title
  };
};
