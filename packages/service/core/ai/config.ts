import OpenAI from '@fastgpt/global/core/ai';
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  StreamChatType,
  UnStreamChatType
} from '@fastgpt/global/core/ai/type';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { addLog } from '../../common/system/log';
import { i18nT } from '../../../web/i18n/utils';
import { OpenaiAccountType } from '@fastgpt/global/support/user/team/type';
import { getLLMModel } from './model';
import { CHAT_API_BASE_URL, CHAT_API_KEY } from '../../../../projects/app/src/config/index';
export const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

export const getAIApi = (props?: { userKey?: OpenaiAccountType; timeout?: number }) => {
  const { userKey, timeout } = props || {};

  return new OpenAI({
    baseURL: CHAT_API_BASE_URL,
    apiKey: CHAT_API_KEY,
    // apiKey: process.env.CHAT_API_KEY,
    httpAgent: global.httpsAgent,
    timeout,
    maxRetries: 2
  });
};

export const getAxiosConfig = (props?: { userKey?: OpenaiAccountType }) => {
  const { userKey } = props || {};

  // const baseUrl = process.env.CHAT_API_BASE_URL;
  // const apiKey = process.env.CHAT_API_KEY || '';

  return {
    baseUrl: CHAT_API_BASE_URL,
    authorization: `Bearer ${CHAT_API_KEY}`
    // authorization: `Bearer ${process.env.CHAT_API_KEY}`
  };
};

export const createChatCompletion = async ({
  body,
  userKey,
  timeout,
  options
}: {
  body: ChatCompletionCreateParamsNonStreaming | ChatCompletionCreateParamsStreaming;
  userKey?: OpenaiAccountType;
  timeout?: number;
  options?: OpenAI.RequestOptions;
}): Promise<
  {
    getEmptyResponseTip: () => string;
  } & (
    | {
        response: StreamChatType;
        isStreamResponse: true;
      }
    | {
        response: UnStreamChatType;
        isStreamResponse: false;
      }
  )
> => {
  try {
    const modelConstantsData = getLLMModel(body.model);

    const formatTimeout = timeout ? timeout : body.stream ? 60000 : 600000;
    const ai = getAIApi({
      userKey,
      timeout: formatTimeout
    });
    const response = await ai.chat.completions.create(body, {
      ...options,
      ...(modelConstantsData.requestUrl ? { path: modelConstantsData.requestUrl } : {}),
      headers: {
        ...options?.headers,
        ...(modelConstantsData.requestAuth
          ? { Authorization: `Bearer ${modelConstantsData.requestAuth}` }
          : {})
      }
    });

    const isStreamResponse =
      typeof response === 'object' &&
      response !== null &&
      ('iterator' in response || 'controller' in response);

    const getEmptyResponseTip = () => {
      addLog.warn(`LLM response empty`, {
        baseUrl: userKey?.baseUrl,
        requestBody: body
      });
      if (userKey?.baseUrl) {
        return `您的 OpenAI key 没有响应: ${JSON.stringify(body)}`;
      }
      return i18nT('chat:LLM_model_response_empty');
    };

    if (isStreamResponse) {
      return {
        response,
        isStreamResponse: true,
        getEmptyResponseTip
      };
    }

    return {
      response,
      isStreamResponse: false,
      getEmptyResponseTip
    };
  } catch (error) {
    addLog.error(`LLM response error`, error);
    addLog.warn(`LLM response error`, {
      baseUrl: userKey?.baseUrl,
      requestBody: body
    });
    if (userKey?.baseUrl) {
      return Promise.reject(`您的 OpenAI key 出错了: ${getErrText(error)}`);
    }
    return Promise.reject(error);
  }
};
