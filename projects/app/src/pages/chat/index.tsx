import React, { useCallback, useEffect, useMemo } from 'react';
import NextHead from '@/components/common/NextHead';
import { useRouter } from 'next/router';
import { getInitChatInfo } from '@/web/core/chat/api';
import { Box, Flex, Drawer, DrawerOverlay, DrawerContent, useTheme } from '@chakra-ui/react';
import { streamFetch } from '@/web/common/api/fetch';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'next-i18next';
import Cookies from 'js-cookie';
import type { StartChatFnProps } from '@/components/core/chat/ChatContainer/type';
import PageContainer from '@/components/PageContainer';
import SideBar from '@/components/SideBar';
import ChatHistorySlider from '@/pageComponents/chat/ChatHistorySlider';
import SliderApps from '@/pageComponents/chat/SliderApps';
import ChatHeader from '@/pageComponents/chat/ChatHeader';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';
import { getChatTitleFromChatMessage } from '@fastgpt/global/core/chat/utils';
import { GPTMessages2Chats } from '@fastgpt/global/core/chat/adapt';
import { getMyApps } from '@/web/core/app/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useMount } from 'ahooks';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import Demo from './demo';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import ChatContextProvider, { ChatContext } from '@/web/core/chat/context/chatContext';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { useContextSelector } from 'use-context-selector';
import dynamic from 'next/dynamic';
import ChatBox from '@/components/core/chat/ChatContainer/ChatBox';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider, {
  ChatRecordContext
} from '@/web/core/chat/context/chatRecordContext';
import { getAgentConfigInfo, getStaffInfo } from '@/web/core/chat/user';
import useWechatShare from './hooks/useWechatShare';
import { redirectAuth } from '@/web/core/chat/utils';
import { share_h5_url, USER_NAME, USER_PWD } from '@/config';
import { initWechatShare } from '@/web/core/chat/wechat';
import { postLogin } from '@/web/support/user/api';
import { agentConfigInfo } from '@/global/core/user/api';
const CustomPluginRunBox = dynamic(() => import('@/pageComponents/chat/CustomPluginRunBox'));

const Chat = ({ myApps }: { myApps: AppListItemType[] }) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPc } = useSystem();

  const { userInfo } = useUserStore();

  const isOpenSlider = useContextSelector(ChatContext, (v) => v.isOpenSlider);
  const onCloseSlider = useContextSelector(ChatContext, (v) => v.onCloseSlider);
  const forbidLoadChat = useContextSelector(ChatContext, (v) => v.forbidLoadChat);
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);
  const onUpdateHistoryTitle = useContextSelector(ChatContext, (v) => v.onUpdateHistoryTitle);

  const resetVariables = useContextSelector(ChatItemContext, (v) => v.resetVariables);
  const isPlugin = useContextSelector(ChatItemContext, (v) => v.isPlugin);
  const chatBoxData = useContextSelector(ChatItemContext, (v) => v.chatBoxData);
  const setChatBoxData = useContextSelector(ChatItemContext, (v) => v.setChatBoxData);

  const chatRecords = useContextSelector(ChatRecordContext, (v) => v.chatRecords);
  const totalRecordsCount = useContextSelector(ChatRecordContext, (v) => v.totalRecordsCount);
  const {
    token,
    setLastChatAppId,
    chatId,
    appId,
    agentConfigInfo,
    outLinkAuthData,
    setAgentConfigInfo,
    setStaffInfo
  } = useChatStore();
  const agentConfig = agentConfigInfo.agentConfig;
  const weChatShareConfig = useMemo(() => agentConfig?.weChatShareConfig || {}, [agentConfig]);
  const tenantId = agentConfigInfo.tenantId;
  // Load chat init data

  const { loading } = useRequest2(
    async () => {
      if (!appId || forbidLoadChat.current) return;

      const res = await getInitChatInfo({ appId, chatId });
      console.log('xxx getInitChatInfo res2', res);
      res.userAvatar = userInfo?.avatar;

      // Wait for state update to complete
      setChatBoxData(res);

      // reset chat variables
      resetVariables({
        variables: res.variables,
        variableList: res.app?.chatConfig?.variables
      });
    },
    {
      manual: false,
      ready: !!token,
      refreshDeps: [appId, chatId],
      onError(e: any) {
        console.log('xxx getInitChatInfo error', e);
        // reset all chat tore
        redirectAuth({ appId, isEmptyPage: false, tenantId });
      },
      onFinally() {
        forbidLoadChat.current = false;
      }
    }
  );

  const onStartChat = useCallback(
    async ({
      messages,
      responseChatItemId,
      controller,
      generatingMessage,
      variables
    }: StartChatFnProps) => {
      // Just send a user prompt
      const histories = messages.slice(-1);
      const { responseText, responseData } = await streamFetch({
        data: {
          messages: histories,
          variables,
          responseChatItemId,
          appId,
          chatId
        },
        onMessage: generatingMessage,
        abortCtrl: controller
      });

      const newTitle = getChatTitleFromChatMessage(GPTMessages2Chats(histories)[0]);

      // new chat
      onUpdateHistoryTitle({ chatId, newTitle });
      // update chat window
      setChatBoxData((state) => ({
        ...state,
        title: newTitle
      }));

      return { responseText, responseData, isNewChat: forbidLoadChat.current };
    },
    [appId, chatId, onUpdateHistoryTitle, setChatBoxData, forbidLoadChat]
  );
  const RenderHistorySlider = useMemo(() => {
    const Children = (
      <ChatHistorySlider confirmClearText={t('common:core.chat.Confirm to clear history')} />
    );

    return isPc || !appId ? (
      <SideBar>{Children}</SideBar>
    ) : (
      <Drawer
        isOpen={isOpenSlider}
        placement="left"
        autoFocus={false}
        size={'xs'}
        onClose={onCloseSlider}
      >
        <DrawerOverlay backgroundColor={'rgba(255,255,255,0.5)'} />
        <DrawerContent maxWidth={'75vw'}>{Children}</DrawerContent>
      </Drawer>
    );
  }, [appId, isOpenSlider, isPc, onCloseSlider, t]);

  return (
    <Flex h={'100%'}>
      <NextHead title={chatBoxData.app.name} icon={chatBoxData.app.avatar}></NextHead>
      {/* pc show myself apps mark */}

      {/* {isPc && (
        <Box borderRight={theme.borders.base} w={'220px'} flexShrink={0}>
          <SliderApps apps={myApps} activeAppId={appId} />
        </Box>
      )} */}
      <PageContainer isLoading={loading} flex={'1 0 0'} w={0} p={[0, '16px']} position={'relative'}>
        <Flex h={'100%'} flexDirection={['column', 'row']}>
          {/* pc always show history. */}
          {RenderHistorySlider}
          {/* chat container */}
          <Flex
            position={'relative'}
            h={[0, '100%']}
            w={['100%', 0]}
            flex={'1 0 0'}
            flexDirection={'column'}
          >
            {/* header */}
            {/* <ChatHeader
              totalRecordsCount={totalRecordsCount}
              apps={myApps}
              history={chatRecords}
              showHistory
            /> */}

            {/* <Demo /> */}

            {/* chat box */}
            <Box flex={'1 0 0'} bg={'white'}>
              {isPlugin ? (
                <CustomPluginRunBox
                  appId={appId}
                  chatId={chatId}
                  outLinkAuthData={outLinkAuthData}
                  onNewChat={() => onChangeChatId(getNanoid())}
                  onStartChat={onStartChat}
                />
              ) : (
                <ChatBox
                  appId={appId}
                  chatId={chatId}
                  outLinkAuthData={outLinkAuthData}
                  showEmptyIntro
                  feedbackType={'user'}
                  onStartChat={onStartChat}
                  chatType={'chat'}
                  isReady={!loading}
                />
              )}
            </Box>
          </Flex>
        </Flex>
      </PageContainer>
    </Flex>
  );
};

const getTenantTokenKey = (agentConfigInfo: agentConfigInfo) => {
  if (agentConfigInfo == null || !agentConfigInfo.tenantId) {
    return 'token';
  }
  const tenantId = agentConfigInfo.tenantId;
  const tenantTokenKey = `${tenantId}token`;
  return tenantTokenKey;
};

const Render = (props: { appId: string; isStandalone?: string }) => {
  const { appId, isStandalone } = props;
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const {
    source,
    chatId,
    lastChatAppId,
    agentConfigInfo,
    setSource,
    setAppId,
    setAgentConfigInfo,
    setStaffInfo,
    token,
    setToken,
    setShareToken
  } = useChatStore();
  const { setUserInfo } = useUserStore();
  const agentConfig = agentConfigInfo.agentConfig;
  const weChatShareConfig = useMemo(() => agentConfig?.weChatShareConfig || {}, [agentConfig]);
  const tenantId = agentConfigInfo.tenantId;

  // 初始化聊天框
  useMount(async () => {
    // pc: redirect to latest model chat
    if (!appId) {
      redirectAuth({ isEmptyPage: false, appId, tenantId });
    }
    setSource('online');
  });

  // Watch appId
  useEffect(() => {
    setAppId(appId);
    // setAppId('67b860750d1c6dfdccebab3d');
  }, [appId, setAppId]);

  const { loading, error } = useRequest2(
    async () => {
      if (!appId) {
        throw new Error('No appId provided');
      }

      const agentConfigInfo = await getAgentConfigInfo({ appId: appId });
      const tenantTokenKey = getTenantTokenKey(agentConfigInfo);
      setAgentConfigInfo(agentConfigInfo);

      const nb_fastgpt_token = Cookies.get('nb_fastgpt_token');
      console.log('xxx nb_fastgpt_token', nb_fastgpt_token);
      if (nb_fastgpt_token && nb_fastgpt_token.length > 0) {
        setToken(nb_fastgpt_token);
        return null; // 直接返回，不继续执行后续代码
      } else {
        // 只有在没有 token 的情况下才执行登录
        const res = await postLogin({
          username: USER_NAME,
          password: USER_PWD
        });
        console.log('xxx postLogin res', res);
        if (res?.token) {
          setToken(res.token);
          Cookies.set('nb_fastgpt_token', res.token, { expires: 2, path: '/' });
          if (res?.user) {
            setUserInfo(res.user);
          }
        }
      }

      // 移除登录相关代码
      if (agentConfigInfo.permissionType !== 'PUBLIC') {
        let shareToken = router.query[tenantTokenKey] as string;
        let cookieToken = Cookies.get(tenantTokenKey);
        if (!shareToken && cookieToken) {
          shareToken = cookieToken;
        }
        if (!shareToken) {
          throw new Error('No token provided for non-public agent');
        }
        setShareToken(shareToken);
        const staffInfo = await getStaffInfo(shareToken, tenantId);
        setStaffInfo(staffInfo);
      }
      setAppId(appId);
      setSource('online');
    },
    {
      manual: false,
      refreshDeps: [appId],
      onError: (error: any) => {
        console.log('Error initializing chat:', error);
        if ((error as { code?: number }).code === 404) {
          redirectAuth({ isEmptyPage: true, appId, tenantId });
        } else {
          const tenantTokenKey = getTenantTokenKey(agentConfigInfo);
          Cookies.remove(tenantTokenKey);
          if (error.code === 401 || error.code === 403) {
            Cookies.remove('nb_fastgpt_token');
          }
          redirectAuth({ appId, tenantId });
        }
      }
    }
  );

  const { data: myApps = [], runAsync: loadMyApps } = useRequest2(
    () => getMyApps({ getRecentlyChat: true }),
    {
      manual: false,
      ready: !!token
    }
  );

  useEffect(() => {
    if (!weChatShareConfig.title) return;

    initWechatShare({
      title: weChatShareConfig.title,
      desc: weChatShareConfig.desc,
      imgUrl: weChatShareConfig.imgUrl,
      link: weChatShareConfig.link || `${share_h5_url}/chat?appId=${appId}`
    });
  }, [weChatShareConfig, appId]);

  // useWechatShare({
  //   title: weChatShareConfig.title,
  //   desc: weChatShareConfig.desc,
  //   imgUrl: weChatShareConfig.imgUrl,
  //   link: weChatShareConfig.link || `${share_h5_url}/chat?appId=${appId}`
  // });

  const chatHistoryProviderParams = useMemo(() => ({ appId, source: ChatSourceEnum.online }), [
    appId
  ]);
  const chatRecordProviderParams = useMemo(() => {
    return {
      appId,
      type: GetChatTypeEnum.normal,
      chatId: chatId
    };
  }, [appId, chatId]);

  return source === ChatSourceEnum.online && token ? (
    <ChatContextProvider params={chatHistoryProviderParams}>
      <ChatItemContextProvider
        showRouteToAppDetail={isStandalone !== '1'}
        showRouteToDatasetDetail={isStandalone !== '1'}
        isShowReadRawSource={true}
        showNodeStatus
      >
        <ChatRecordContextProvider params={chatRecordProviderParams}>
          <Chat myApps={myApps} />
        </ChatRecordContextProvider>
      </ChatItemContextProvider>
    </ChatContextProvider>
  ) : null;
};

export async function getServerSideProps(context: any) {
  return {
    props: {
      appId: context?.query?.appId || '',
      isStandalone: context?.query?.isStandalone || '',
      ...(await serviceSideProps(context, ['chat']))
    }
  };
}

export default Render;
