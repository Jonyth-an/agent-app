import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type { CreateQuestionGuideParams } from '@/pages/api/core/ai/agent/v2/createQuestionGuide';

export const postQuestionGuide = (data: CreateQuestionGuideParams, cancelToken: AbortController) =>
  POST<string[]>('/core/ai/agent/v2/createQuestionGuide', data, {
    cancelToken,
    headers: {
      // Authorization: 'Bearer fastgpt-crNagOolOA9OFRIBJAZ1a8u1qC3iJzgjljppGigs0dHXN0qTz9KMfeXJG'
      Authorization: 'Bearer fastgpt-p63AUUIP24T5MpIDDJVgDG06sva1bg7abFbQ8awRirjG5ad9jSMMr'
    }
  });
