import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { GetChatRecordsProps } from '@/global/core/chat/api';
import { DispatchNodeResponseKeyEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import { transformPreviewHistories } from '@/global/core/chat/utils';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { getChatItemDetail, getChatItems } from '@fastgpt/service/core/chat/controller';
import { authChatCrud } from '@/service/support/permission/auth/chat';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { ChatItemValueTypeEnum, ChatRoleEnum } from '@fastgpt/global/core/chat/constants';
import { filterPublicNodeResponseData } from '@fastgpt/global/core/chat/utils';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

export type getPaginationRecordsQuery = {};

export type getPaginationRecordsBody = PaginationProps & GetChatRecordsProps;

export type getPaginationRecordsResponse = PaginationResponse<ChatItemType>;
async function handler(
  req: ApiRequestProps<getPaginationRecordsBody, getPaginationRecordsQuery>,
  _res: ApiResponseType<any>
): Promise<getPaginationRecordsResponse> {
  const { appId, chatId, dataId, loadCustomFeedbacks, type = GetChatTypeEnum.normal } = req.body;

  if (!appId || !chatId || !dataId) {
    return {
      total: 0,
      list: []
    };
  }

  const [app, { responseDetail, showNodeStatus, authType }] = await Promise.all([
    MongoApp.findById(appId, 'type').lean(),
    authChatCrud({
      req,
      authToken: true,
      authApiKey: true,
      ...req.body
    })
  ]);

  if (!app) {
    return Promise.reject(AppErrEnum.unExist);
  }
  const isPlugin = app.type === AppTypeEnum.plugin;
  const isOutLink = authType === GetChatTypeEnum.outLink;

  const fieldMap = {
    [GetChatTypeEnum.normal]: `dataId obj value adminFeedback userBadFeedback userGoodFeedback time hideInUI ${
      DispatchNodeResponseKeyEnum.nodeResponse
    } ${loadCustomFeedbacks ? 'customFeedbacks' : ''}`,
    [GetChatTypeEnum.outLink]: `dataId obj value userGoodFeedback userBadFeedback adminFeedback time hideInUI ${DispatchNodeResponseKeyEnum.nodeResponse}`,
    [GetChatTypeEnum.team]: `dataId obj value userGoodFeedback userBadFeedback adminFeedback time hideInUI ${DispatchNodeResponseKeyEnum.nodeResponse}`
  };

  const { histories } = await getChatItemDetail({
    appId,
    dataId,
    field: fieldMap[type]
  });

  // Remove important information
  if (isOutLink && app.type !== AppTypeEnum.plugin) {
    histories.forEach((item) => {
      if (item.obj === ChatRoleEnum.AI) {
        item.responseData = filterPublicNodeResponseData({
          flowResponses: item.responseData,
          responseDetail
        });

        if (showNodeStatus === false) {
          item.value = item.value.filter((v) => v.type !== ChatItemValueTypeEnum.tool);
        }
      }
    });
  }
  const list = isPlugin ? histories : transformPreviewHistories(histories, responseDetail);
  return {
    list,
    total: list.length
  };
}

export default NextAPI(handler);
