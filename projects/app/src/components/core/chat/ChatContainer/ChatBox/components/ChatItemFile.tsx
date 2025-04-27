import { Box, BoxProps, Card, Flex } from '@chakra-ui/react';
import React, { useMemo, useRef } from 'react';
import ChatController, { type ChatControllerProps } from './ChatController';
import ChatAvatar from './ChatAvatar';
import { MessageCardStyle } from '../constants';
import { formatChatValue2InputType } from '../utils';
import Markdown from '@/components/Markdown';
import styles from '../index.module.scss';
import {
  ChatItemValueTypeEnum,
  ChatRoleEnum,
  ChatStatusEnum
} from '@fastgpt/global/core/chat/constants';
import FilesBlock from './FilesBox';
import { ChatBoxContext } from '../Provider';
import { useContextSelector } from 'use-context-selector';
import { useCopyData } from '@fastgpt/web/hooks/useCopyData';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useTranslation } from 'next-i18next';
import { AIChatItemValueItemType, ChatItemValueItemType } from '@fastgpt/global/core/chat/type';
import { CodeClassNameEnum } from '@/components/Markdown/utils';
import { cloneDeep, isEqual } from 'lodash';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { formatTimeToChatItemTime } from '@fastgpt/global/common/string/time';
import dayjs from 'dayjs';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import { useChatStore } from '@/web/core/chat/context/useChatStore';

const colorMap = {
  [ChatStatusEnum.loading]: {
    bg: 'myGray.100',
    color: 'myGray.600'
  },
  [ChatStatusEnum.running]: {
    bg: 'green.50',
    color: 'green.700'
  },
  [ChatStatusEnum.finish]: {
    bg: 'green.50',
    color: 'green.700'
  }
};

type BasicProps = {
  avatar?: string;
  statusBoxData?: {
    status: `${ChatStatusEnum}`;
    name: string;
  };
  questionGuides?: string[];
  children?: React.ReactNode;
} & ChatControllerProps;

type Props = BasicProps & {
  type: ChatRoleEnum.Human | ChatRoleEnum.AI;
};

const RenderText = React.memo(function RenderText({ value }: any) {
  if (value.type === ChatItemValueTypeEnum.text && value.text) {
    // let source = value.text.content || '';
    let source =
      '\ncodeClassNameEnum: CONTENT_CARD avatar: ![【理财笔记】“农银天天利”系列产品申赎规则](https://fs-file.newbanker.cn/image/marketing/2025-02-06/bdd2d8ce-f311-4842-8323-6d3ccf3b964b.jpg) title: [【理财笔记】“农银天天利”系列产品申赎规则](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c92808993e2a9b20194d9e63a890339%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：长期来看股票类资产是收益较高的投资品种](https://fs-file.newbanker.cn/image/marketing/2024-06-11/7b56839f-c492-4aff-b7eb-3181381fed1e.jpg) title: [投教精品 | 基金投资ABC：长期来看股票类资产是收益较高的投资品种](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb0190050081f4006c%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![基金定投真的适合所有人？所有基金吗？](https://fs-file.newbanker.cn/image/marketing/2024-06-03/235d27f7-aa0a-428a-b123-0ff5f7e4af57.jpg) title: [基金定投真的适合所有人？所有基金吗？](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb019005257b9d00d2%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：持有时间和收益的关系](https://fs-file.newbanker.cn/image/marketing/2024-06-11/6be09672-4ea6-4e77-adf5-83b7a01b27e0.jpg) title: [投教精品 | 基金投资ABC：持有时间和收益的关系](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb01900501a3590076%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![基金定投是如何赚钱的：微笑曲线的秘密](https://fs-file.newbanker.cn/image/marketing/2024-06-11/8002ed6e-3131-41d1-8b80-79fede247eb1.jpg) title: [基金定投是如何赚钱的：微笑曲线的秘密](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb01900526d84b00d7%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：持有多久能不亏钱？](https://fs-file.newbanker.cn/image/marketing/2024-06-11/287d173d-b280-424b-a796-22c41eefe562.jpg) title: [投教精品 | 基金投资ABC：持有多久能不亏钱？](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb019005016f840074%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：“百年”老基金的收益](https://fs-file.newbanker.cn/image/marketing/2024-06-11/9cb5d433-ced4-4f21-bb5a-ebc89ebb2625.jpg) title: [投教精品 | 基金投资ABC：“百年”老基金的收益](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb01900500c2d4006e%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![核心资产 百分之选 | 富国中证100ETF发起式联接基金](https://fs-file.newbanker.cn/image/marketing/2024-06-03/0d3e35b5-2272-47c3-b8f9-bddeb7566286.jpg) title: [核心资产 百分之选 | 富国中证100ETF发起式联接基金](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858fdc795c018fdd736427008f%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：抓住“黄金20天”](https://fs-file.newbanker.cn/image/marketing/2024-06-11/f4c30d40-ea90-4fd2-b799-eec8bf82e261.jpg) title: [投教精品 | 基金投资ABC：抓住“黄金20天”](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb0190050218f2007a%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![十分钟读懂出海：出海等于出口吗？](https://fs-file.newbanker.cn/image/marketing/2024-11-08/c523e410-b6b3-40f3-adbe-3777daf2deef.jpg) title: [十分钟读懂出海：出海等于出口吗？](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280899275b62101930ac2363301d2%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![报告速递 | 2024年第4期《养老金融评论》内容概要](https://fs-file.newbanker.cn/image/course/2024-05-20/cf6c5035-e589-4d8e-9ac2-061241c9a050.png) title: [报告速递 | 2024年第4期《养老金融评论》内容概要](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858f669024018f93d08a3101c5%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![螺丝钉定投实盘（买入+转换高估品种）｜第155期](https://fs-file.newbanker.cn/image/marketing/2024-06-11/80217a58-158c-4b72-9a49-006e01c23260.jpg) title: [螺丝钉定投实盘（买入+转换高估品种）｜第155期](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb0190052748d100db%2526tenantId%253D1%2526shareConfig%253Dtrue)';
    // First empty line
    // if (!source && !isLastChild) return null;
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

const ChatItem = (props: Props) => {
  console.log('xxx ChatItem props', props);
  const { type, avatar, statusBoxData, children, isLastChild, questionGuides = [], chat } = props;

  const { isPc } = useSystem();

  const styleMap: BoxProps = {
    ...(type === ChatRoleEnum.Human
      ? {
          order: 0,
          borderRadius: '8px 0 8px 8px',
          justifyContent: 'flex-end',
          textAlign: 'right',
          bg: 'primary.100'
        }
      : {
          order: 1,
          borderRadius: '0 8px 8px 8px',
          justifyContent: 'flex-start',
          textAlign: 'left',
          bg: 'myGray.50'
        }),
    fontSize: 'mini',
    fontWeight: '400',
    color: 'myGray.500'
  };
  const { t } = useTranslation();

  const isChatting = useContextSelector(ChatBoxContext, (v) => v.isChatting);
  const chatType = useContextSelector(ChatBoxContext, (v) => v.chatType);
  const showNodeStatus = useContextSelector(ChatItemContext, (v) => v.showNodeStatus);
  const isChatLog = chatType === 'log';

  const { copyData } = useCopyData();

  const chatStatusMap = useMemo(() => {
    if (!statusBoxData?.status) return;
    return colorMap[statusBoxData.status];
  }, [statusBoxData?.status]);

  /* 
    1. The interactive node is divided into n dialog boxes.
    2. Auto-complete the last textnode
  */
  const splitAiResponseResults = useMemo(() => {
    if (chat.obj !== ChatRoleEnum.AI) return [chat.value];

    // Remove empty text node
    const filterList = chat.value.filter((item, i) => {
      if (item.type === ChatItemValueTypeEnum.text && !item.text?.content?.trim()) {
        return false;
      }
      return item;
    });

    const groupedValues: AIChatItemValueItemType[][] = [];
    let currentGroup: AIChatItemValueItemType[] = [];

    filterList.forEach((value) => {
      if (value.type === 'interactive') {
        if (currentGroup.length > 0) {
          groupedValues.push(currentGroup);
          currentGroup = [];
        }

        groupedValues.push([value]);
      } else {
        currentGroup.push(value);
      }
    });

    if (currentGroup.length > 0) {
      groupedValues.push(currentGroup);
    }

    // Check last group is interactive, Auto add a empty text node(animation)
    const lastGroup = groupedValues[groupedValues.length - 1];
    if (isChatting || groupedValues.length === 0) {
      if (
        (lastGroup &&
          lastGroup[lastGroup.length - 1] &&
          lastGroup[lastGroup.length - 1].type === ChatItemValueTypeEnum.interactive) ||
        groupedValues.length === 0
      ) {
        groupedValues.push([
          {
            type: ChatItemValueTypeEnum.text,
            text: {
              content: ''
            }
          }
        ]);
      }
    }

    return groupedValues;
  }, [chat.obj, chat.value, isChatting]);
  const MessageCardFileStyle = cloneDeep(MessageCardStyle);
  MessageCardFileStyle.maxW = ['100%', '100%'];
  console.log('xxx ChatItemFile splitAiResponseResults', splitAiResponseResults);
  return (
    <Box
      _hover={{
        '& .time-label': {
          display: 'block'
        }
      }}
    >
      {/* content */}
      {splitAiResponseResults.map((value, i) => (
        <Box
          key={i}
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
            {/* {type === ChatRoleEnum.AI && ( */}
            <AIContentCard chatValue={value} dataId={chat.dataId} />
            {/* )} */}
            {/* Example: Response tags. A set of dialogs only needs to be displayed once*/}
            {i === splitAiResponseResults.length - 1 && <>{children}</>}
            {/* 对话框底部的复制按钮 */}
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default React.memo(ChatItem);
