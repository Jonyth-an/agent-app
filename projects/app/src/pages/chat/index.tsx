import React, { useCallback, useEffect, useMemo } from 'react';
import NextHead from '@/components/common/NextHead';
import { Box, Flex, Drawer, DrawerOverlay, DrawerContent, useTheme } from '@chakra-ui/react';
import { StreamCBParams, streamFetch } from '@/web/common/api/fetch';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import type { StartChatFnProps } from '@/components/core/chat/ChatContainer/type';
import PageContainer from '@/components/PageContainer';
import SideBar from '@/components/SideBar';
import ChatHistorySlider from '@/pageComponents/chat/ChatHistorySlider';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';
import { getChatTitleFromChatMessage } from '@fastgpt/global/core/chat/utils';
import { GPTMessages2Chats } from '@fastgpt/global/core/chat/adapt';
import { getMyApps } from '@/web/core/app/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useMount } from 'ahooks';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import ChatContextProvider, { ChatContext } from '@/web/core/chat/context/chatContext';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { useContextSelector } from 'use-context-selector';
import dynamic from 'next/dynamic';
import ChatBox from '@/components/core/chat/ChatContainer/ChatBox';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider from '@/web/core/chat/context/chatRecordContext';
import useChatInitialization from '@/web/core/chat/context/useChatInitialization';
import { useTranslation } from 'next-i18next';
import { getInitChatInfo } from '@/web/core/chat/api';
import Cookies from 'js-cookie';
import { redirectToErrorPage } from '@/web/core/chat/context/errorRedirect';
import { useRouter } from 'next/router';
import useWechatAuth from '@/web/core/chat/context/useWechatAuth';
import { getAgentPermission, getRemainingCount, saveChatLog } from '../../web/core/chat/user';
import { convertTimeToTimestamp, getCurrentTimestamp } from '@/web/core/chat/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { AgentAccessType, ChatStatusType } from '@/web/core/app/constants';
import { hasUserChatPermission } from '@/web/core/chat/context/chatCheck';
import { tokenIsValid } from '@/web/core/chat/context/utils';
import { initWechatShare } from '@/web/core/chat/wechat';
const CustomPluginRunBox = dynamic(() => import('@/pageComponents/chat/CustomPluginRunBox'));

const Chat = () => {
  const { t } = useTranslation();
  const { isPc } = useSystem();
  const router = useRouter();
  const { userInfo } = useUserStore();
  const isOpenSlider = useContextSelector(ChatContext, (v) => v.isOpenSlider);
  const onCloseSlider = useContextSelector(ChatContext, (v) => v.onCloseSlider);
  const forbidLoadChat = useContextSelector(ChatContext, (v) => v.forbidLoadChat);
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);
  const onUpdateHistoryTitle = useContextSelector(ChatContext, (v) => v.onUpdateHistoryTitle);

  const resetVariables = useContextSelector(ChatItemContext, (v) => v.resetVariables);
  const isPlugin = useContextSelector(ChatItemContext, (v) => v.isPlugin);
  const setChatBoxData = useContextSelector(ChatItemContext, (v) => v.setChatBoxData);
  const { toast } = useToast();

  const {
    staffInfo,
    chatId,
    appId,
    agentConfigInfo,
    outLinkAuthData,
    setShareToken,
    setStaffInfo,
    unionid,
    openid,
    nickname,
    setChatStauts,
    chatStauts
  } = useChatStore();
  const tenantId = agentConfigInfo.tenantId;
  const agentId = agentConfigInfo.agentId;
  const appKey = agentConfigInfo.appKey;
  const permissionType = agentConfigInfo.permissionType;
  const name = staffInfo.name;

  // Load chat init data

  const { loading } = useRequest2(
    async () => {
      if (!appId || !appKey || !openid || forbidLoadChat.current) return;

      const res = await getInitChatInfo({ appId, chatId, openid, unionid }, appKey);
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
      ready: !!appId && !!openid && !!appKey,
      refreshDeps: [appId, chatId, appKey],
      onError(e: any) {
        redirectToErrorPage(router, e);
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
      // 修改 onSaveChatLog 函数
      const onSaveChatLog = async (data: StreamCBParams, histories: any[], variables: any) => {
        await saveChatLog({
          agentId,
          answer: data.responseText,
          answerTime: getCurrentTimestamp(),
          chatId,
          name,
          nickname,
          openid,
          question: histories[0]?.content || '', // 获取用户问题
          questionTime: convertTimeToTimestamp(variables.cTime),
          tenantId,
          unionid
        });
      };

      const canChat = await hasUserChatPermission(
        {
          unionid,
          agentId,
          tenantId
        },
        router
      );
      console.log(
        'ccc onStartChat chatStauts login pre canChat',
        canChat,
        'chatStauts',
        chatStauts
      );
      if (canChat) {
        setChatStauts(ChatStatusType.CAN_CHAT);
      } else {
        setChatStauts(ChatStatusType.DISABLE_CHAT);
        return { responseText: '', responseData: [], isNewChat: forbidLoadChat.current };
      }
      console.log(
        'ccc onStartChat chatStauts login after canChat',
        canChat,
        'chatStauts',
        chatStauts
      );
      const histories = messages.slice(-1);
      const { responseText, responseData } = await streamFetch({
        data: {
          params: {
            unionid,
            agentId,
            tenantId
          },
          messages: histories,
          variables,
          responseChatItemId,
          appId,
          chatId,
          stream: false
        },
        onMessage: generatingMessage,
        abortCtrl: controller,
        callback: (data) => onSaveChatLog(data, histories, variables)
      });
      console.log('ccc responseText, responseData', responseText, responseData);
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
    [
      name,
      nickname,
      tenantId,
      appId,
      router,
      chatStauts,
      setChatStauts,
      chatId,
      agentId,
      onUpdateHistoryTitle,
      setChatBoxData,
      forbidLoadChat,
      openid,
      unionid
    ]
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
      <NextHead
        title={agentConfigInfo.name}
        icon={agentConfigInfo.avatar}
        desc={agentConfigInfo.description}
      ></NextHead>
      {/* pc show myself apps mark */}
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

const Render = (props: { appId: string; isStandalone?: string }) => {
  const { appId, isStandalone } = props;
  const { source, chatId, agentConfigInfo, setSource, setAppId, openid, unionid } = useChatStore();
  const appKey = agentConfigInfo.appKey;
  const router = useRouter();
  // 初始化聊天框
  useMount(async () => {
    // pc: redirect to latest model chat
    if (!appId) {
      redirectToErrorPage(router, new Error('appId is required'));
    }
    setSource('online');
  });

  // Watch appId
  useEffect(() => {
    setAppId(appId);
  }, [appId, setAppId]);
  useChatInitialization(appId);

  useEffect(() => {
    if (!agentConfigInfo.name) {
      console.warn(
        'aagentConfigInfo is missing. WeChat share will not be initialized.',
        agentConfigInfo
      );
      return;
    }
    // 创建一个异步函数在 useEffect 内部调用
    const setupWechatShare = async () => {
      try {
        await initWechatShare({
          title: agentConfigInfo.name,
          desc: agentConfigInfo.description,
          imgUrl: agentConfigInfo.avatar,
          link: agentConfigInfo.url
        });
        console.log('微信分享初始化完成 agentConfigInfo', agentConfigInfo);
      } catch (error) {
        console.error('微信分享初始化失败:', error);
      }
    };
    // 调用异步函数
    setupWechatShare();
  }, [agentConfigInfo, appId]);

  const chatHistoryProviderParams = useMemo(
    () => ({ appId, appKey, source: ChatSourceEnum.online, openid, unionid }),
    [appId, appKey, openid, unionid]
  );
  const chatRecordProviderParams = useMemo(() => {
    return {
      appKey,
      appId,
      type: GetChatTypeEnum.normal,
      chatId: chatId
    };
  }, [appId, chatId, appKey]);

  return source === ChatSourceEnum.online && openid && !!appKey ? (
    <ChatContextProvider params={chatHistoryProviderParams}>
      <ChatItemContextProvider
        showRouteToAppDetail={isStandalone !== '1'}
        showRouteToDatasetDetail={isStandalone !== '1'}
        isShowReadRawSource={true}
        showNodeStatus
      >
        <ChatRecordContextProvider params={chatRecordProviderParams}>
          <Chat />
        </ChatRecordContextProvider>
      </ChatItemContextProvider>
    </ChatContextProvider>
  ) : null;
};

export async function getServerSideProps(context: any) {
  // console.log('ccc getServerSideProps context', context);
  return {
    props: {
      appId: context?.query?.appId || '',
      isStandalone: context?.query?.isStandalone || '',
      ...(await serviceSideProps(context, ['chat']))
    }
  };
}

export default Render;
