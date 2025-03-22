import { GET, POST, DELETE, PUT } from '@/web/common/api/request';
import {
  agentConfigInfo,
  ChatLogReqParams,
  ChatLogResData,
  RemainingCountParams,
  SignatureInfo,
  SignatureInfoReq,
  StaffInfo,
  WechatAuthInfo
} from '@/global/core/user/api';
import { agentConfigInfoReq } from '../../../global/core/user/api';
import { share_h5_url } from '@/config';

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

// 获取agent配置信息
export const getAgentConfigInfo = (agentConfigInfoReq: agentConfigInfoReq) =>
  GET<agentConfigInfo>(`/mobile/api/v1/ai/agent/get`, agentConfigInfoReq, {
    baseURL: '/marketing-ai'
  });

// 获取微信授权
export const getSignatureInfo = (data: SignatureInfoReq) =>
  POST<SignatureInfo>(
    `/marketing-api/api/v1/h5/wechat/getSignature?url=${data.url}`,
    {},
    {
      baseURL: '/marketing'
    }
  );

// 获取微信授权码
export const getWechatAuthCode = (authUrl: string) => {
  const toAuthUrl = `${share_h5_url}/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=${encodeURIComponent(authUrl)}`;
  console.log('ddd redirect authUrl', authUrl);
  console.log('ddd redirect toAuthUrl', toAuthUrl);
  return toAuthUrl;
};

// 获取微信授权
export const getWechatAuthInfo = (params: { code: string }) =>
  GET<WechatAuthInfo>(`/marketing-api/api/v1/h5/wechat/default`, params, {
    baseURL: '/marketing'
  });

// 保存聊天记录
export const saveChatLog = (data: ChatLogReqParams) =>
  POST<ChatLogResData>(`/mobile/api/v1/ai/agent/chatlog/save`, data, {
    baseURL: '/marketing-ai'
  });

// 剩余会话次数
export const getRemainingCount = (params: RemainingCountParams) =>
  GET<WechatAuthInfo>(`/mobile/api/v1/ai/agent/chatlog/remainingCount`, params, {
    baseURL: '/marketing-ai'
  });
