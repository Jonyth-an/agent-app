import { GET, POST, DELETE, PUT } from '@/web/common/api/request';
import { AgentConfigRes, UserInfo } from '@/global/core/user/api';
import { AgentConfigReq } from '../../../global/core/user/api';

/**
 * 获取用户信息
 */
export const getUserInfo = () =>
  GET<UserInfo>(
    `/mobile/api/v1/org/staff/getStaffInfo`,
    {},
    {
      baseURL: '/uc-system',
      headers: {
        token:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0ZW5hbnRJZCI6IjEiLCJjbGllbnQiOiIxMzEiLCJ0b2tlbl90eXBlIjoidG9rZW4iLCJ1c2VyTmFtZSI6Iue9l-ael-WGmyIsInVzZXJJZCI6IjM3NTIxMzMxMDc3NzQ4NDgiLCJ1c2VyIjoiMzAwIiwiYWNjb3VudCI6IjM3NTIxMzMxMDc3NzQ4NDkiLCJpYXQiOjE3NDAyMDQ4OTYsIm5iZiI6MTc0MDIwNDg5NiwiZXhwIjoxNzQwODA5Njk2fQ.yV33tLr8Kz51XWlgmWQ2tjUKezemeO2KK-XlJD6AzvA',
        tenantId: 1
      }
    }
  );

export const getAgentConfig = (agentConfigReq: AgentConfigReq) =>
  GET<AgentConfigRes>(`/mobile/api/v1/ai/agent/config`, agentConfigReq, {
    baseURL: '/uc-system'
  });

// export const getChatRecords = (data: getPaginationRecordsBody) =>
//   POST<getPaginationRecordsResponse>('core/chat/getPaginationRecords', data);
