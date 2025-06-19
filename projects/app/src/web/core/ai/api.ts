import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type { CreateQuestionGuideParams } from '@/pages/api/core/ai/agent/v2/createQuestionGuide';
import { StartChatFnProps } from '@/components/core/chat/ChatContainer/type';
import { getFetchBaseUrl } from '@/web/common/utils/config';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';

// 添加返回值类型接口
export interface CusAiResponse {
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
}

export const postQuestionGuide = (
  data: CreateQuestionGuideParams,
  cancelToken: AbortController,
  appKey: string
) =>
  POST<string[]>('/core/ai/agent/v2/createQuestionGuide', data, {
    cancelToken,
    headers: {
      // Authorization: 'Bearer fastgpt-crNagOolOA9OFRIBJAZ1a8u1qC3iJzgjljppGigs0dHXN0qTz9KMfeXJG'
      Authorization: `Bearer ${appKey}`
    }
  });

export const postQAGuide = (
  data: any,
  cancelToken: AbortController,
  appKey: string,
  qaVersion: string
) =>
  POST<CusAiResponse>(`/${qaVersion}/chat/completions`, data, {
    cancelToken,
    headers: {
      Authorization: `Bearer ${appKey}`
    },
    baseURL: getWebReqUrl(getFetchBaseUrl())
  });
