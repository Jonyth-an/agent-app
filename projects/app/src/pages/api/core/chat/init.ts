import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { getGuideModule, getAppChatConfig } from '@fastgpt/global/core/workflow/utils';
import { getChatModelNameListByModules } from '@/service/core/app/workflow';
import type { InitChatProps, InitChatResponse } from '@/global/core/chat/api.d';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { ChatErrEnum } from '@fastgpt/global/common/error/code/chat';
import { getAppLatestVersion } from '@fastgpt/service/core/app/version/controller';
import { NextAPI } from '@/service/middleware/entry';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { UserApp } from '@fastgpt/service/core/user/userAppSchema';
import { addLog } from '@fastgpt/service/common/system/log';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<InitChatResponse | void> {
  let { appId, chatId, openid, unionid } = req.query as InitChatProps;

  if (!appId) {
    return jsonRes(res, {
      code: 501,
      message: "You don't have an app yet"
    });
  }

  // auth app permission
  const [{ app, tmbId }, chat] = await Promise.all([
    authApp({
      req,
      authToken: true,
      authApiKey: true,
      appId,
      per: ReadPermissionVal
    }),
    chatId ? MongoChat.findOne({ appId, chatId }) : undefined
  ]);

  // auth chat permission
  if (chat && !app.permission.hasManagePer && String(tmbId) !== String(chat?.tmbId)) {
    return Promise.reject(ChatErrEnum.unAuthChat);
  }

  // 只有当 chatId 存在时才进行存储
  if ((openid || unionid) && chatId && appId) {
    try {
      // 先查询是否存在记录
      const existRecord = await UserApp.findOne({
        $and: [
          { appId },
          { chatId },
          {
            $or: [{ openid: openid || null }, { unionid: unionid || null }]
          }
        ]
      });
      addLog.info(`init save chatId info`, {
        appId,
        openid,
        unionid,
        chatId,
        existRecord
      });
      // 记录不存在时才创建
      if (!existRecord) {
        await UserApp.create({
          openid: openid || undefined,
          unionid: unionid || undefined,
          appId,
          chatId,
          updateTime: new Date()
        });
      }
    } catch (error) {
      addLog.error(
        `init save chatId error, appId: ${appId}, openid: ${openid}, unionid: ${unionid}, chatId: ${chatId}, error:`,
        error
      );
      // 不影响主流程，记录失败仍继续
    }
  }

  // get app and history
  const { nodes, chatConfig } = await getAppLatestVersion(app._id, app);
  const pluginInputs =
    chat?.pluginInputs ??
    nodes?.find((node) => node.flowNodeType === FlowNodeTypeEnum.pluginInput)?.inputs ??
    [];

  return {
    chatId,
    appId,
    title: chat?.title,
    userAvatar: undefined,
    variables: chat?.variables,
    app: {
      chatConfig: getAppChatConfig({
        chatConfig,
        systemConfigNode: getGuideModule(nodes),
        storeVariables: chat?.variableList,
        storeWelcomeText: chat?.welcomeText,
        isPublicFetch: false
      }),
      chatModels: getChatModelNameListByModules(nodes),
      name: app.name,
      avatar: app.avatar,
      intro: app.intro,
      type: app.type,
      pluginInputs
    }
  };
}

export default NextAPI(handler);

export const config = {
  api: {
    responseLimit: '10mb'
  }
};
