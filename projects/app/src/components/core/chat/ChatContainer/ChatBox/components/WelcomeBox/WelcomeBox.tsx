import { Box, Card } from '@chakra-ui/react';
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
  }
  return (
    <Box py={3}>
      {/* avatar */}
      {showAIAvatar && <ChatAvatar src={agentConfigInfo.avatar} type={'AI'} />}
      {/* message */}
      <Box textAlign={'left'}>
        <Card
          order={2}
          mt={2}
          {...messageCardStyle}
          bg={'white'}
          boxShadow={'0 0 8px rgba(0,0,0,0.15)'}
        >
          <Markdown source={`~~~guide \n${welcomeText}`} forbidZhFormat />
        </Card>
      </Box>
    </Box>
  );
};

export default WelcomeBox;
