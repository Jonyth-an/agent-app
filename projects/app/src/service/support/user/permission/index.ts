import { AgentPermissionData, AgentPermissionParams, ApiResponse } from '@/global/core/user/api';
import { GET } from '@fastgpt/service/common/api/serverRequest';
import { addLog } from '@fastgpt/service/common/system/log';
import { API_MARKETING_AI_URL } from '@fastgpt/service/common/system/tools';

export const getAgentPermissionApi = (params: AgentPermissionParams) => {
  addLog.info(' getAgentPermission API_MARKETING_AI_URL ', {
    API_MARKETING_AI_URL
  });
  // 发送GET请求，获取代理权限
  return GET<ApiResponse<AgentPermissionData>>(`/mobile/api/v1/user/agent/permission`, params, {
    baseURL: `${API_MARKETING_AI_URL}/marketing-ai`
  });
};
