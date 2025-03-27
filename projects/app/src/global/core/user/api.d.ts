// 定义响应数据的整体结构使用 type
export type ApiResponse<T = any> = {
  data: T;
};

// 定义具体的响应数据结构 使用 type 替代 interface
export type StaffInfoResponse = ApiResponse<StaffInfo>;
export type ParentOrgIdList = number[];
// 定义用户信息的具体字段 使用 type 替代 interface
export type StaffInfo = {
  id: number; // 用户ID，假设为数字类型
  name: string; // 用户姓名，字符串类型
  nickname: string;
  userId: string; // 用户标识符ID，字符串类型
  orgId: number; // 用户所属组织ID，假设为数字类型
  parentOrgIdList: ParentOrgIdList; // 用户所属组织的上级组织ID列表，数组中的每个元素都是数字类型
};

export type agentConfigInfoReq = {
  appId: number | string; // 智能体ID
};
export type agentConfigDes = {
  weChatShareConfig: any;
  list: any[];
};
export type memberLevelItem = {
  grade: number;
  id: number;
  price: number;
  name: string;
};

// 定义整个 API 返回的数据结构
export type agentConfigInfo = {
  agentId: number; // 智能体ID
  name: string; // 智能体名称
  avatar: string; // 智能体图标链接
  sourceType: string; // 来源类型
  thirdResourceId: string; // 来源类型
  enabled: boolean; // 是否启用
  permissionType: string; // 权限类型
  description: string; // 智能体描述
  memberPrice: string; // 会员价格
  userGuideConfig: string; // 会员价格
  agentPrice: number; // 智能体价格
  agentConfig: any; // 智能体配置
  tenantId: number; // 租户ID
  status: string; // 智能体描述
  url: string;
  appKey: string;
  freeCount: number;
  paid: boolean; // 已独立支付
  memberLevelOk: boolean; // 已满足会员要求
  memberLevelList: memberLevelItem[];
};

export type SignatureInfoReq = {
  url: string; // appId
};

export type SignatureInfo = {
  appId: string; // appId
  signature: string; // signature
  timestamp: string; // timestamp
  nonce: string; // nonce
};

// 微信授权信息
export interface WechatAuthInfo {
  avatar: string;
  city: string;
  country: string;
  headimgurl: string;
  id: string;
  nickname: string;
  openid: string;
  privilege: string[];
  province: string;
  sex: number;
  timeCreated: string;
  timeLastUpdated: string;
  unionid: string;
  wechatExtends: any; // 如果有具体结构，可以替换为具体类型
}

export interface WechatUserInfo {
  openid: string;
  unionid: string;
  wechatInfoId: string;
  nickname: string;
  sex: number;
}

export type ChatLogReqParams = {
  agentId: number;
  answer: string;
  answerTime: string;
  chatId: string;
  name: string;
  nickname: string;
  openid: string;
  question: string;
  questionTime: string;
  tenantId: number;
  unionid: string;
};

export interface ChatLogResData extends ChatLogReqParams {
  id: string;
}

export interface RemainingCountParams {
  openid: string;
  unionid: string;
  agentId: number;
}

export interface PrePayParams {
  openid: string;
  payScene: string;
  tenantId: number;
  agentId: number;
}

export interface PrePayData {
  appId: string;
  id: string;
  nonceStr: string;
  packageVal: string;
  paySign: string;
  prepayId: string;
  signType: string;
  timestamp: string;
  tradeStatus: string;
}
export interface PayResultParams {
  outTradeNo: string;
}

export type AgentPermissionParams = {
  agentId: number;
  tenantId: number;
  unionid: string;
};

export type AgentPermissionData = {
  isLimited: boolean;
  remainingCount: number;
};
