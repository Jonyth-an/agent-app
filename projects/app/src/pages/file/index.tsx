import React, { useEffect, useMemo } from 'react';
import NextHead from '@/components/common/NextHead';
import { Box, Flex } from '@chakra-ui/react';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import PageContainer from '@/components/PageContainer';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useMount } from 'ahooks';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import { useContextSelector } from 'use-context-selector';
import { ChatRoleEnum, ChatSourceEnum, RunPlatformEnum } from '@fastgpt/global/core/chat/constants';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import {
  ChatRecordDetailContextProvider,
  ChatRecordContext
} from '@/web/core/chat/context/chatRecordContext';

import { getInitChatInfo } from '@/web/core/chat/api';
import { redirectToErrorPage } from '@/web/core/chat/context/errorRedirect';
import { useRouter } from 'next/router';
import ChatItemFile from '@/components/core/chat/ChatContainer/ChatBox/components/ChatItemFile';
import { ChatContext } from '@/web/core/chat/context/chatContext';

const Chat = ({ appKey }: { appKey: string }) => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const forbidLoadChat = useContextSelector(ChatContext, (v) => v.forbidLoadChat);
  const chatRecords = useContextSelector(ChatRecordContext, (v) => v.chatRecords);
  const resetVariables = useContextSelector(ChatItemContext, (v) => v.resetVariables);
  const setChatBoxData = useContextSelector(ChatItemContext, (v) => v.setChatBoxData);

  const { chatId, appId, agentConfigInfo, unionid, openid } = useChatStore();
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
  console.log('xxx file chatRecords', chatRecords);
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
              {/* @ts-ignore */}
              {chatRecords && chatRecords.length > 0 && <ChatItemFile {...chatRecords[0]} />}
            </Box>
          </Flex>
        </Flex>
      </PageContainer>
    </Flex>
  );
};

const Render = (props: {
  appId: string;
  isStandalone?: string;
  appKey: string;
  dataId: string;
}) => {
  console.log('xxx props', props);
  const { appId, isStandalone, appKey, dataId } = props;
  const { source, chatId, setSource, setAppId } = useChatStore();
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

  const chatRecordProviderParams = useMemo(() => {
    return {
      dataId,
      appKey,
      appId,
      type: GetChatTypeEnum.normal,
      chatId: chatId
    };
  }, [appId, chatId, appKey, dataId]);

  return source === ChatSourceEnum.online && !!appKey ? (
    <ChatItemContextProvider
      showRouteToAppDetail={isStandalone !== '1'}
      showRouteToDatasetDetail={isStandalone !== '1'}
      isShowReadRawSource={true}
      showNodeStatus
    >
      <ChatRecordDetailContextProvider params={chatRecordProviderParams}>
        <Chat appKey={appKey} />
      </ChatRecordDetailContextProvider>
    </ChatItemContextProvider>
  ) : null;
};

export async function getServerSideProps(context: any) {
  // console.log('ccc getServerSideProps context', context);
  return {
    props: {
      appId: context?.query?.appId || '',
      isStandalone: context?.query?.isStandalone || '',
      appKey: context?.query?.appKey || '',
      dataId: context?.query?.dataId || '',
      ...(await serviceSideProps(context, ['chat']))
    }
  };
}

export default Render;
