import { AgentPermissionData, AgentPermissionParams, ApiResponse } from '@/global/core/user/api';
import { GET } from '@fastgpt/service/common/api/serverRequest';
import { API_MARKETING_AI_URL } from '@fastgpt/service/common/system/tools';

export const getAgentPermission = (params: AgentPermissionParams) =>
  // 发送GET请求，获取代理权限
  GET<ApiResponse<AgentPermissionData>>(`/mobile/api/v1/user/agent/permission`, params, {
    baseURL: `${API_MARKETING_AI_URL}/marketing-ai`
  });
