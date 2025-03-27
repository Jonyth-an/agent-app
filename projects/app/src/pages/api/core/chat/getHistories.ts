import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { authOutLink } from '@/service/support/permission/auth/outLink';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamSpaceToken } from '@/service/support/permission/auth/team';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { GetHistoriesProps } from '@/global/core/chat/api';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import { addMonths } from 'date-fns';
import { UserApp } from '@fastgpt/service/core/user/userAppSchema'; // 添加导入
import { addLog } from '@fastgpt/service/common/system/log';

export type getHistoriesQuery = {};

export type getHistoriesBody = PaginationProps<GetHistoriesProps>;

export type getHistoriesResponse = {};
export type UserChatRecord = {
  chatId: string;
};

async function handler(
  req: ApiRequestProps<getHistoriesBody, getHistoriesQuery>,
  _res: ApiResponseType<any>
): Promise<PaginationResponse<getHistoriesResponse>> {
  const { appId, shareId, outLinkUid, teamId, teamToken, source, openid, unionid } = req.body; // 添加 openid, unionid
  const { offset, pageSize } = parsePaginationRequest(req);

  const match = await (async () => {
    if (shareId && outLinkUid) {
      const { uid } = await authOutLink({ shareId, outLinkUid });

      return {
        shareId,
        outLinkUid: uid,
        updateTime: {
          $gte: addMonths(new Date(), -1)
        }
      };
    }
    if (appId && teamId && teamToken) {
      const { uid } = await authTeamSpaceToken({ teamId, teamToken });
      return {
        teamId,
        appId,
        outLinkUid: uid,
        source: ChatSourceEnum.team
      };
    }
    if (appId) {
      const { tmbId } = await authCert({ req, authToken: true, authApiKey: true });

      // 如果有 openid 或 unionid，查询该用户的聊天记录

      return {
        tmbId,
        appId,
        source
      };
    }
  })();

  if (!match) {
    return {
      list: [],
      total: 0
    };
  }

  let chatIds: string[] = [];
  if (openid || unionid) {
    try {
      const userChats: UserChatRecord[] = await UserApp.find({
        appId,
        $or: [...(openid ? [{ openid }] : []), ...(unionid ? [{ unionid }] : [])]
      }).select('chatId');

      chatIds = userChats.map((chat) => chat.chatId);
      addLog.info('getHistories get chatIds', {
        appId,
        openid,
        unionid,
        chatIds,
        userChats
      });
    } catch (error) {
      addLog.error('getHistories get chatIds error', {
        appId,
        openid,
        unionid,
        error
      });
    }
    // 查询用户的所有聊天记录

    // return {
    //   appId,
    //   chatId: { $in: chatIds } // 只查询用户相关的聊天
    // };
  }

  const [data, total] = await Promise.all([
    await MongoChat.find(match, 'chatId title top customTitle appId updateTime')
      .sort({ top: -1, updateTime: -1 })
      .skip(offset)
      .limit(pageSize)
      .lean(),
    MongoChat.countDocuments(match)
  ]);

  let resData = data.map((item) => ({
    chatId: item.chatId,
    updateTime: item.updateTime,
    appId: item.appId,
    customTitle: item.customTitle,
    title: item.title,
    top: item.top
  }));

  const filterData = resData.filter((item) => chatIds.includes(item.chatId));
  const filterTotal = filterData.length;
  addLog.info('getHistories filter after chat data', {
    appId,
    openid,
    unionid,
    resData,
    total,
    filterData,
    filterTotal
  });
  return {
    list: resData,
    total
  };
}

export default NextAPI(handler);
