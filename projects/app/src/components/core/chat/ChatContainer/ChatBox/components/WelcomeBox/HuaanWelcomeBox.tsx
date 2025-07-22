import { Box, Card, Image } from '@chakra-ui/react';
import React from 'react';
import { MessageCardStyle, MessageCardFullStyle } from '../../constants';
import Markdown from '@/components/Markdown';
import ChatAvatar from '../ChatAvatar';

import { useContextSelector } from 'use-context-selector';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { cloneDeep } from 'lodash';

const WelcomeBox = ({ welcomeText }: { welcomeText: string }) => {
  const { agentConfigInfo } = useChatStore();
  const chatItemConfig = agentConfigInfo?.agentConfig?.chatItemConfig || {};
  const isFullWidth = chatItemConfig?.isFullWidth ?? false;
  const showAIAvatar = chatItemConfig?.showAIAvatar ?? true;

  let messageCardStyle = cloneDeep(MessageCardStyle);
  if (isFullWidth) {
    messageCardStyle = cloneDeep(MessageCardFullStyle);
    messageCardStyle.w = ['100%', '100%'];
    messageCardStyle.py = 0;
    messageCardStyle.pt = 5;
    messageCardStyle.pb = 2;
  }
  return (
    <Box className="welcome-box-wrapper" position={'relative'} mt={3} pb={3} pt={'73px'}>
      {/* avatar */}
      {showAIAvatar && <ChatAvatar src={agentConfigInfo.avatar} type={'AI'} />}
      {/* message */}
      <Box textAlign={'left'}>
        <Box
          as="div"
          flexShrink={0}
          width="100%"
          height="200px"
          overflow="hidden"
          position={'absolute'}
          top={'0px'}
          left={'0px'}
        >
          <Image
            src={
              'https://aim-pic-test-huaan.newtamp.cn/image/course/2025-07-21/198509d8-3ab2-4d67-98ef-fcf6c6acfdbb.png'
            }
            alt={'welcome'}
            objectFit="cover"
            width="100%"
            height="100%"
          />
        </Box>
        <Card className="welcome-card" order={2} mt={2} {...messageCardStyle} bg={'white'}>
          <Markdown source={`~~~guide \n${welcomeText}`} forbidZhFormat />
        </Card>
      </Box>
    </Box>
  );
};

export default WelcomeBox;
