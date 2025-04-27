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
import { ChatRoleEnum, ChatSourceEnum, RunPlatformEnum } from '@fastgpt/global/core/chat/constants';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider, {
  ChatRecordDetailContextProvider
} from '@/web/core/chat/context/chatRecordContext';
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
import ChatItemFile from '@/components/core/chat/ChatContainer/ChatBox/components/ChatItemFile';
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

  const chetItemFileObj = {
    type: ChatRoleEnum.AI,
    avatar:
      'https://fs-file.newbanker.cn/image/course/2025-02-22/abcfa495-e2e6-4500-ab06-acc7059f9023.png',
    chat: {
      _id: '680b7308eb633a354f2556a6',
      dataId: 'r3Yp3mECobbMHGuFPPkky6Ta',
      hideInUI: false,
      obj: 'AI',
      value: [
        {
          type: 'text',
          text: {
            content:
              '\ncodeClassNameEnum: CONTENT_CARD avatar: ![【理财笔记】“农银天天利”系列产品申赎规则](https://fs-file.newbanker.cn/image/marketing/2025-02-06/bdd2d8ce-f311-4842-8323-6d3ccf3b964b.jpg) title: [【理财笔记】“农银天天利”系列产品申赎规则](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c92808993e2a9b20194d9e63a890339%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：长期来看股票类资产是收益较高的投资品种](https://fs-file.newbanker.cn/image/marketing/2024-06-11/7b56839f-c492-4aff-b7eb-3181381fed1e.jpg) title: [投教精品 | 基金投资ABC：长期来看股票类资产是收益较高的投资品种](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb0190050081f4006c%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![基金定投真的适合所有人？所有基金吗？](https://fs-file.newbanker.cn/image/marketing/2024-06-03/235d27f7-aa0a-428a-b123-0ff5f7e4af57.jpg) title: [基金定投真的适合所有人？所有基金吗？](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb019005257b9d00d2%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：持有时间和收益的关系](https://fs-file.newbanker.cn/image/marketing/2024-06-11/6be09672-4ea6-4e77-adf5-83b7a01b27e0.jpg) title: [投教精品 | 基金投资ABC：持有时间和收益的关系](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb01900501a3590076%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![基金定投是如何赚钱的：微笑曲线的秘密](https://fs-file.newbanker.cn/image/marketing/2024-06-11/8002ed6e-3131-41d1-8b80-79fede247eb1.jpg) title: [基金定投是如何赚钱的：微笑曲线的秘密](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb01900526d84b00d7%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：持有多久能不亏钱？](https://fs-file.newbanker.cn/image/marketing/2024-06-11/287d173d-b280-424b-a796-22c41eefe562.jpg) title: [投教精品 | 基金投资ABC：持有多久能不亏钱？](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb019005016f840074%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：“百年”老基金的收益](https://fs-file.newbanker.cn/image/marketing/2024-06-11/9cb5d433-ced4-4f21-bb5a-ebc89ebb2625.jpg) title: [投教精品 | 基金投资ABC：“百年”老基金的收益](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb01900500c2d4006e%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![核心资产 百分之选 | 富国中证100ETF发起式联接基金](https://fs-file.newbanker.cn/image/marketing/2024-06-03/0d3e35b5-2272-47c3-b8f9-bddeb7566286.jpg) title: [核心资产 百分之选 | 富国中证100ETF发起式联接基金](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858fdc795c018fdd736427008f%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![投教精品 | 基金投资ABC：抓住“黄金20天”](https://fs-file.newbanker.cn/image/marketing/2024-06-11/f4c30d40-ea90-4fd2-b799-eec8bf82e261.jpg) title: [投教精品 | 基金投资ABC：抓住“黄金20天”](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb0190050218f2007a%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![十分钟读懂出海：出海等于出口吗？](https://fs-file.newbanker.cn/image/marketing/2024-11-08/c523e410-b6b3-40f3-adbe-3777daf2deef.jpg) title: [十分钟读懂出海：出海等于出口吗？](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280899275b62101930ac2363301d2%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![报告速递 | 2024年第4期《养老金融评论》内容概要](https://fs-file.newbanker.cn/image/course/2024-05-20/cf6c5035-e589-4d8e-9ac2-061241c9a050.png) title: [报告速递 | 2024年第4期《养老金融评论》内容概要](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858f669024018f93d08a3101c5%2526tenantId%253D1%2526shareConfig%253Dtrue)\ncodeClassNameEnum: CONTENT_CARD avatar: ![螺丝钉定投实盘（买入+转换高估品种）｜第155期](https://fs-file.newbanker.cn/image/marketing/2024-06-11/80217a58-158c-4b72-9a49-006e01c23260.jpg) title: [螺丝钉定投实盘（买入+转换高估品种）｜第155期](https://aim-saas-share-dev.newtamp.cn/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=https%3A%2F%2Faim-saas-share-dev.newtamp.cn%2Fshare%2FadvLogin%3Fpage%3DAppAdvNewsDetail%26params%3Dvalue%253D2c9280858febf4fb0190052748d100db%2526tenantId%253D1%2526shareConfig%253Dtrue)'
          }
        }
      ],
      time: '2025-04-25T11:33:28.347Z',
      userGoodFeedback: 'yes',
      llmModuleAccount: 0,
      totalQuoteList: [
        {
          id: '67ccea1c04736e6a37a0326f',
          chunkIndex: 6,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84204736e6a37a0010a',
          sourceName: '投教精品 | 基金投资ABC：持有时间和收益的关系',
          score: [
            {
              type: 'embedding',
              value: 0.8849397897720337,
              index: 1
            },
            {
              type: 'rrf',
              value: 0.032018442622950824,
              index: 0
            },
            {
              type: 'fullText',
              value: 0.5384615384615384,
              index: 12
            },
            {
              type: 'reRank',
              value: 0.96753323,
              index: 3
            }
          ],
          tokens: 41
        },
        {
          id: '67ccea4104736e6a37a037fa',
          chunkIndex: 47,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84604736e6a37a00894',
          sourceName: '基金定投真的适合所有人？所有基金吗？',
          score: [
            {
              type: 'embedding',
              value: 0.8653355240821838,
              index: 11
            },
            {
              type: 'rrf',
              value: 0.03125763125763126,
              index: 1
            },
            {
              type: 'fullText',
              value: 0.5357142857142857,
              index: 2
            },
            {
              type: 'reRank',
              value: 0.980053,
              index: 2
            }
          ],
          tokens: 40
        },
        {
          id: '67ccea1604736e6a37a031bf',
          chunkIndex: 5,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84104736e6a379fff8f',
          sourceName: '投教精品 | 基金投资ABC：抓住“黄金20天”',
          score: [
            {
              type: 'embedding',
              value: 0.8685135245323181,
              index: 6
            },
            {
              type: 'rrf',
              value: 0.028370221327967807,
              index: 4
            },
            {
              type: 'reRank',
              value: 0.8352149,
              index: 10
            }
          ],
          tokens: 138
        },
        {
          id: '67ccea5b04736e6a37a03c8a',
          chunkIndex: 5,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84904736e6a37a00fde',
          sourceName: '投教精品 | 基金投资ABC：长期来看股票类资产是收益较高的投资品种',
          score: [
            {
              type: 'embedding',
              value: 0.8572530746459961,
              index: 22
            },
            {
              type: 'rrf',
              value: 0.027893738140417457,
              index: 5
            },
            {
              type: 'reRank',
              value: 0.9891816,
              index: 1
            }
          ],
          tokens: 135
        },
        {
          id: '67cceaae04736e6a37a04f1b',
          chunkIndex: 33,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce85504736e6a37a0260c',
          sourceName: '核心资产 百分之选 | 富国中证100ETF发起式联接基金',
          score: [
            {
              type: 'embedding',
              value: 0.8872197270393372,
              index: 0
            },
            {
              type: 'rrf',
              value: 0.02694394213381555,
              index: 9
            },
            {
              type: 'reRank',
              value: 0.86522406,
              index: 9
            }
          ],
          tokens: 9
        },
        {
          id: '67cce9fc04736e6a37a02f07',
          chunkIndex: 7,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce83e04736e6a379ff95d',
          sourceName: '投教精品 | 基金投资ABC：持有多久能不亏钱？',
          score: [
            {
              type: 'embedding',
              value: 0.8619306683540344,
              index: 16
            },
            {
              type: 'rrf',
              value: 0.026779422128259338,
              index: 10
            },
            {
              type: 'reRank',
              value: 0.9540518,
              index: 5
            }
          ],
          tokens: 134
        },
        {
          id: '67cce84d04736e6a37a01688',
          chunkIndex: 41,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84c04736e6a37a014fb',
          sourceName: '【理财笔记】“农银天天利”系列产品申赎规则',
          score: [
            {
              type: 'embedding',
              value: 0.8664177656173706,
              index: 9
            },
            {
              type: 'rrf',
              value: 0.02629443272196072,
              index: 11
            },
            {
              type: 'reRank',
              value: 0.99338466,
              index: 0
            }
          ],
          tokens: 35
        },
        {
          id: '67cce84604736e6a37a009cd',
          chunkIndex: 4,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84604736e6a37a00894',
          sourceName: '基金定投真的适合所有人？所有基金吗？',
          score: [
            {
              type: 'embedding',
              value: 0.8536055088043213,
              index: 21
            },
            {
              type: 'rrf',
              value: 0.025694893341952164,
              index: 12
            },
            {
              type: 'reRank',
              value: 0.9069832,
              index: 7
            }
          ],
          tokens: 51
        },
        {
          id: '67ccea4104736e6a37a037e1',
          chunkIndex: 50,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84604736e6a37a00894',
          sourceName: '基金定投真的适合所有人？所有基金吗？',
          score: [
            {
              type: 'embedding',
              value: 0.8489010334014893,
              index: 35
            },
            {
              type: 'rrf',
              value: 0.025451688923802042,
              index: 13
            },
            {
              type: 'reRank',
              value: 0.9524858,
              index: 6
            }
          ],
          tokens: 70
        },
        {
          id: '67cce84404736e6a37a004ff',
          chunkIndex: 6,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84304736e6a37a0043d',
          sourceName: '投教精品 | 基金投资ABC：“百年”老基金的收益',
          score: [
            {
              type: 'embedding',
              value: 0.8520099520683289,
              index: 31
            },
            {
              type: 'rrf',
              value: 0.025245441795231416,
              index: 16
            },
            {
              type: 'reRank',
              value: 0.8897206,
              index: 8
            }
          ],
          tokens: 120
        },
        {
          id: '67ccea2d04736e6a37a0348a',
          chunkIndex: 14,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce84404736e6a37a00523',
          sourceName: '基金定投是如何赚钱的：微笑曲线的秘密',
          score: [
            {
              type: 'embedding',
              value: 0.850189745426178,
              index: 30
            },
            {
              type: 'rrf',
              value: 0.023581336696090797,
              index: 21
            },
            {
              type: 'reRank',
              value: 0.9563089,
              index: 4
            }
          ],
          tokens: 44
        },
        {
          id: '67cce9c904736e6a37a02bd4',
          chunkIndex: 64,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce83904736e6a379ff0bb',
          sourceName: '螺丝钉定投实盘（买入+转换高估品种）｜第155期',
          score: [
            {
              type: 'embedding',
              value: 0.848761260509491,
              index: 36
            },
            {
              type: 'rrf',
              value: 0.023513513513513516,
              index: 22
            },
            {
              type: 'reRank',
              value: 0.80131465,
              index: 13
            }
          ],
          tokens: 74
        },
        {
          id: '67cceab504736e6a37a0514b',
          chunkIndex: 38,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce85604736e6a37a02786',
          sourceName: '十分钟读懂出海：出海等于出口吗？',
          score: [
            {
              type: 'fullText',
              value: 0.8214285714285715,
              index: 3
            },
            {
              type: 'rrf',
              value: 0.01977124183006536,
              index: 38
            },
            {
              type: 'reRank',
              value: 0.8153795,
              index: 11
            }
          ],
          tokens: 78
        },
        {
          id: '67ccea9a04736e6a37a04a10',
          chunkIndex: 44,
          datasetId: '67c901c40d1c6dfdccf794f6',
          collectionId: '67cce85204736e6a37a01f02',
          sourceName: '报告速递 | 2024年第4期《养老金融评论》内容概要',
          score: [
            {
              type: 'fullText',
              value: 0.625,
              index: 8
            },
            {
              type: 'rrf',
              value: 0.01928522231575725,
              index: 43
            },
            {
              type: 'reRank',
              value: 0.8020909,
              index: 12
            }
          ],
          tokens: 18
        }
      ],
      totalRunningTime: 11.22,
      status: 'finish'
    },
    isLastChild: true,
    showVoiceIcon: true,
    questionGuides: [],
    children: [null, false]
  };
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
              <ChatItemFile isLastChild={true} {...chetItemFileObj} />
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
  const { source, chatId, agentConfigInfo, setSource, setAppId, openid, unionid, runPlatform } =
    useChatStore();
  // const appKey = 'fastgpt-uzalJfJGopouieZfRxol4e7Xlb0Qpw3msrCABLTWVXQ2lqXarbWh60omT';
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
  // useChatInitialization(appId);

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
    // <ChatContextProvider params={chatHistoryProviderParams}>
    <ChatItemContextProvider
      showRouteToAppDetail={isStandalone !== '1'}
      showRouteToDatasetDetail={isStandalone !== '1'}
      isShowReadRawSource={true}
      showNodeStatus
    >
      <ChatRecordDetailContextProvider params={chatRecordProviderParams}>
        <Chat />
      </ChatRecordDetailContextProvider>
    </ChatItemContextProvider>
  ) : // </ChatContextProvider>
  null;
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
