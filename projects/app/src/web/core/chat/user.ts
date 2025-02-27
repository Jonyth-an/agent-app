import { GET, POST, DELETE, PUT } from '@/web/common/api/request';
import {
  agentConfigInfo,
  SignatureInfo,
  SignatureInfoReq,
  StaffInfo
} from '@/global/core/user/api';
import { agentConfigInfoReq } from '../../../global/core/user/api';

/**
 * 获取用户信息
 */
export const getStaffInfo = (token: string) =>
  GET<StaffInfo>(
    `/mobile/api/v1/org/staff/getStaffInfo`,
    {},
    {
      baseURL: '/uc-system',
      headers: {
        token:
          token ||
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0ZW5hbnRJZCI6IjEiLCJjbGllbnQiOiIxMzEiLCJ0b2tlbl90eXBlIjoidG9rZW4iLCJ1c2VyTmFtZSI6Iue9l-ael-WGmyIsInVzZXJJZCI6IjM3NTIxMzMxMDc3NzQ4NDgiLCJ1c2VyIjoiMzAwIiwiYWNjb3VudCI6IjM3NTIxMzMxMDc3NzQ4NDkiLCJpYXQiOjE3NDAyMDQ4OTYsIm5iZiI6MTc0MDIwNDg5NiwiZXhwIjoxNzQwODA5Njk2fQ.yV33tLr8Kz51XWlgmWQ2tjUKezemeO2KK-XlJD6AzvA',
        tenantId: 1
      }
    }
  );

export const getAgentConfigInfo = (agentConfigInfoReq: agentConfigInfoReq) =>
  GET<agentConfigInfo>(`/mobile/api/v1/ai/agent/get`, agentConfigInfoReq, {
    baseURL: '/marketing-ai'
  });

export const getSignatureInfo = (data: SignatureInfoReq) =>
  POST<SignatureInfo>(`core/chat/getPaginationRecords?url=${data.url}`);
// export const getChatRecords = (data: getPaginationRecordsBody) =>
//   POST<getPaginationRecordsResponse>('core/chat/getPaginationRecords', data);
