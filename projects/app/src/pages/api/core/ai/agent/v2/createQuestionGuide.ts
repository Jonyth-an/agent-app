import type { NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { pushQuestionGuideUsage } from '@/service/support/wallet/usage/push';
import { createQuestionGuide } from '@fastgpt/service/core/ai/functions/createQuestionGuide';
import { authChatCrud } from '@/service/support/permission/auth/chat';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { getChatItems } from '@fastgpt/service/core/chat/controller';
import { chats2GPTMessages } from '@fastgpt/global/core/chat/adapt';
import { getAppLatestVersion } from '@fastgpt/service/core/app/version/controller';
import { getDefaultLLMModel } from '@fastgpt/service/core/ai/model';
import { addLog } from '@fastgpt/service/common/system/log';

export type CreateQuestionGuideParams = OutLinkChatAuthProps & {
  appId: string;
  chatId: string;
  questionGuide?: {
    open: boolean;
    model?: string;
    customPrompt?: string;
  };
};

async function handler(req: ApiRequestProps<CreateQuestionGuideParams>, res: NextApiResponse<any>) {
  const { appId, chatId, questionGuide: inputQuestionGuide } = req.body;
  const [{ tmbId, teamId }] = await Promise.all([
    authChatCrud({
      req,
      authToken: true,
      authApiKey: true,
      ...req.body
    })
  ]);
  addLog.info('createQuestionGuide handler 1', { appId, chatId, inputQuestionGuide });
  // Auth app and get questionGuide config
  const questionGuide = await (async () => {
    if (inputQuestionGuide) {
      return inputQuestionGuide;
    }
    const { chatConfig } = await getAppLatestVersion(appId);
    addLog.info('createQuestionGuide handler questionGuide2', { appId, chatId, chatConfig });
    return chatConfig.questionGuide;
  })();

  // Get histories
  const { histories } = await getChatItems({
    appId,
    chatId,
    offset: 0,
    limit: 6,
    field: 'obj value time'
  });
  const messages = chats2GPTMessages({ messages: histories, reserveId: false });

  const qgModel = questionGuide?.model || getDefaultLLMModel().model;
  addLog.info('createQuestionGuide handler qgModel3', { messages, qgModel });
  const { result, inputTokens, outputTokens } = await createQuestionGuide({
    messages,
    model: qgModel,
    customPrompt: questionGuide?.customPrompt
  });
  addLog.info('createQuestionGuide handler result, inputTokens, outputTokens4 ', {
    result,
    inputTokens,
    outputTokens
  });

  pushQuestionGuideUsage({
    model: qgModel,
    inputTokens,
    outputTokens,
    teamId,
    tmbId
  });
  addLog.info('createQuestionGuide handler qgModel5', {
    qgModel,
    inputTokens,
    outputTokens,
    teamId,
    tmbId
  });

  return result;
}

export default NextAPI(handler);
