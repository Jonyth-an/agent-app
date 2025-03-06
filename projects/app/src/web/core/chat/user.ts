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
export const getStaffInfo = (token: string, tenantId: number) =>
  GET<StaffInfo>(
    `/mobile/api/v1/org/staff/getStaffInfo`,
    {},
    {
      baseURL: '/uc-system',
      headers: {
        token,
        tenantId
      }
    }
  );

export const getAgentConfigInfo = (agentConfigInfoReq: agentConfigInfoReq) =>
  GET<agentConfigInfo>(`/mobile/api/v1/ai/agent/get`, agentConfigInfoReq, {
    baseURL: '/marketing-ai'
  });

export const getSignatureInfo = (data: SignatureInfoReq) =>
  POST<SignatureInfo>(
    `/marketing-api/api/v1/h5/wechat/getSignature?url=${data.url}`,
    {},
    {
      baseURL: '/marketing'
    }
  );
