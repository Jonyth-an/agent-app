import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authDatasetCollection } from '@fastgpt/service/support/permission/dataset/auth';
import { DatasetCollectionTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { createFileToken } from '@fastgpt/service/support/permission/controller';
import { BucketNameEnum, ReadFileBaseUrl } from '@fastgpt/global/common/file/constants';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { DatasetErrEnum } from '@fastgpt/global/common/error/code/dataset';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { AIChatItemType, ChatHistoryItemResType } from '@fastgpt/global/core/chat/type';
import { authChatCrud } from '@/service/support/permission/auth/chat';
import { getCollectionWithDataset } from '@fastgpt/service/core/dataset/controller';
import { useApiDatasetRequest } from '@fastgpt/service/core/dataset/apiDataset/api';
import { POST } from '@fastgpt/service/common/api/plusRequest';
import { addLog } from '@fastgpt/service/common/system/log';
import { getLogger } from 'log4js';

const logger = getLogger();
export type readCollectionSourceQuery = {};

export type readCollectionSourceBody = {
  collectionId: string;

  appId?: string;
  chatId?: string;
  chatItemId?: string;
} & OutLinkChatAuthProps;

export type readCollectionSourceResponse = {
  type: 'url';
  value: string;
};

const authCollectionInChat = async ({
  collectionId,
  appId,
  chatId,
  chatItemId
}: {
  collectionId: string;
  appId: string;
  chatId: string;
  chatItemId: string;
}) => {
  try {
    addLog.debug('api/dataset/collection/read -> authCollectionInChat', {
      collectionId,
      appId,
      chatId,
      chatItemId
    });
    logger.debug('authCollectionInChat start', { collectionId, appId, chatId, chatItemId });

    const chatItem = (await MongoChatItem.findOne(
      {
        appId,
        chatId,
        dataId: chatItemId
      },
      'responseData'
    ).lean()) as AIChatItemType;

    if (!chatItem) {
      addLog.warn('api/dataset/collection/read -> chatItem not found', { collectionId, chatId });
      logger.warn('chatItem not found', { collectionId, chatId });
      return Promise.reject(DatasetErrEnum.unAuthDatasetFile);
    }

    // 找 responseData 里，是否有该文档 id
    const responseData = chatItem.responseData || [];
    const flatResData: ChatHistoryItemResType[] =
      responseData
        ?.map((item) => {
          return [
            item,
            ...(item.pluginDetail || []),
            ...(item.toolDetail || []),
            ...(item.loopDetail || [])
          ];
        })
        .flat() || [];

    if (
      flatResData.some((item) => {
        if (item.quoteList) {
          return item.quoteList.some((quote) => quote.collectionId === collectionId);
        }
        return false;
      })
    ) {
      return true;
    }
  } catch (error) {
    addLog.error('api/dataset/collection/read -> authCollectionInChat error', error);
    logger.error('authCollectionInChat error', { error, collectionId });
    return Promise.reject(DatasetErrEnum.unAuthDatasetFile);
  }
};

async function handler(
  req: ApiRequestProps<readCollectionSourceBody, readCollectionSourceQuery>
): Promise<readCollectionSourceResponse> {
  addLog.debug('api/dataset/collection/read -> handler start', req.body);
  logger.debug('handler start', req.body);

  const { collectionId, appId, chatId, chatItemId, shareId, outLinkUid, teamId, teamToken } =
    req.body;

  const {
    collection,
    teamId: userTeamId,
    tmbId: uid,
    authType
  } = await (async () => {
    if (!appId || !chatId || !chatItemId) {
      addLog.debug('api/dataset/collection/read -> direct dataset access', { collectionId });
      logger.debug('direct dataset access', { collectionId });

      return authDatasetCollection({
        req,
        authToken: true,
        authApiKey: true,
        collectionId: req.body.collectionId,
        per: ReadPermissionVal
      });
    }

    /* 
      1. auth chat read permission
      2. auth collection quote in chat
      3. auth outlink open show quote
    */
    addLog.debug('api/dataset/collection/read -> chat dataset access', { collectionId, appId });
    logger.debug('chat dataset access', { collectionId, appId });
    const [authRes, collection] = await Promise.all([
      authChatCrud({
        req,
        authToken: true,
        appId,
        chatId,
        shareId,
        outLinkUid,
        teamId,
        teamToken
      }),
      getCollectionWithDataset(collectionId),
      authCollectionInChat({ appId, chatId, chatItemId, collectionId })
    ]);

    if (!authRes.showRawSource) {
      addLog.warn('api/dataset/collection/read -> no raw source permission', { collectionId });
      logger.warn('no raw source permission', { collectionId });
      return Promise.reject(DatasetErrEnum.unAuthDatasetFile);
    }

    return {
      ...authRes,
      collection
    };
  })();

  const sourceUrl = await (async () => {
    addLog.debug('api/dataset/collection/read -> getting source URL', {
      type: collection.type,
      fileId: collection.fileId,
      name: collection.name
    });
    logger.debug('getting source URL', { type: collection.type, fileId: collection.fileId });

    if (collection.type === DatasetCollectionTypeEnum.file && collection.fileId) {
      const token = await createFileToken({
        bucketName: BucketNameEnum.dataset,
        teamId: userTeamId,
        uid,
        fileId: collection.fileId,
        customExpireMinutes: authType === 'outLink' ? 5 : undefined
      });

      const url = `${ReadFileBaseUrl}/${collection.name}?token=${token}`;
      addLog.debug('api/dataset/collection/read -> file URL generated', { url });
      logger.debug('file URL generated', { url });
      return url;
    }
    if (collection.type === DatasetCollectionTypeEnum.link && collection.rawLink) {
      return collection.rawLink;
    }
    if (collection.type === DatasetCollectionTypeEnum.apiFile && collection.apiFileId) {
      const apiServer = collection.dataset.apiServer;
      const feishuServer = collection.dataset.feishuServer;
      const yuqueServer = collection.dataset.yuqueServer;

      if (apiServer) {
        return useApiDatasetRequest({ apiServer }).getFilePreviewUrl({
          apiFileId: collection.apiFileId
        });
      }

      if (feishuServer || yuqueServer) {
        return POST<string>(`/core/dataset/systemApiDataset`, {
          type: 'read',
          apiFileId: collection.apiFileId,
          feishuServer,
          yuqueServer
        });
      }

      return '';
    }
    if (collection.type === DatasetCollectionTypeEnum.externalFile) {
      if (collection.externalFileId && collection.dataset.externalReadUrl) {
        return collection.dataset.externalReadUrl.replace('{{fileId}}', collection.externalFileId);
      }
      if (collection.externalFileUrl) {
        return collection.externalFileUrl;
      }
    }

    return '';
  })();

  addLog.info('api/dataset/collection/read -> success', { collectionId, sourceUrl });
  logger.info('handler success', { collectionId, sourceUrl });

  return {
    type: 'url',
    value: sourceUrl
  };
}

export default NextAPI(handler);
