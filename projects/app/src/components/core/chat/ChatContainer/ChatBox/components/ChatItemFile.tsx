import { Box, BoxProps, Card, Flex } from '@chakra-ui/react';
import React from 'react';
import { MessageCardStyle } from '../constants';
import Markdown from '@/components/Markdown';
import { ChatItemValueTypeEnum } from '@fastgpt/global/core/chat/constants';

import { ChatItemValueItemType } from '@fastgpt/global/core/chat/type';
import { cloneDeep } from 'lodash';

const RenderText = React.memo(function RenderText({ value }: any) {
  if (value.type === ChatItemValueTypeEnum.text && value.text) {
    let source = value.text.content || '';
    if (!source) return null;
    return <Markdown source={source} showAnimation={false} />;
  }
});

const AIContentCard = React.memo(function AIContentCard({
  chatValue,
  dataId
}: {
  dataId: string;
  chatValue: ChatItemValueItemType[];
}) {
  console.log('xxx ChatItemFile chatValue', chatValue);
  return (
    <Flex flexDirection={'column'} gap={2}>
      {chatValue.map((value, i) => {
        const key = `${dataId}-ai-${i}`;
        return <RenderText key={key} value={value} />;
      })}
    </Flex>
  );
});

const ChatItem = (props: { value: ChatItemValueItemType[]; dataId: string }) => {
  console.log('xxx ChatItem props', props);
  const styleMap: BoxProps = {
    order: 1,
    borderRadius: '0 8px 8px 8px',
    justifyContent: 'flex-start',
    textAlign: 'left',
    bg: 'myGray.50',
    fontSize: 'mini',
    fontWeight: '400',
    color: 'myGray.500'
  };

  const MessageCardFileStyle = cloneDeep(MessageCardStyle);
  MessageCardFileStyle.maxW = ['100%', '100%'];
  return (
    <Box
      id="chat-record-detail"
      _hover={{
        '& .time-label': {
          display: 'block'
        }
      }}
    >
      <Box
        mt={['0px', 2]}
        className="chat-box-card"
        textAlign={styleMap.textAlign}
        _hover={{
          '& .footer-copy': {
            display: 'block'
          }
        }}
      >
        <Card
          {...MessageCardFileStyle}
          bg={styleMap.bg}
          borderRadius={styleMap.borderRadius}
          textAlign={'left'}
        >
          <AIContentCard chatValue={props.value} dataId={props.dataId} />
        </Card>
      </Box>
    </Box>
  );
};

export default React.memo(ChatItem);
