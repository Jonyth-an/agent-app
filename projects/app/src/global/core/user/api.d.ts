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
  userId: string; // 用户标识符ID，字符串类型
  orgId: number; // 用户所属组织ID，假设为数字类型
  parentOrgIdList: ParentOrgIdList; // 用户所属组织的上级组织ID列表，数组中的每个元素都是数字类型
};

export type agentConfigInfoReq = {
  appId: number | string; // 智能体ID
};
// 定义整个 API 返回的数据结构
export type agentConfigInfo = {
  agentId: string; // 智能体ID
  name: string; // 智能体名称
  avatar: string; // 智能体图标链接
  sourceType: string; // 来源类型
  thirdResourceId: string; // 来源类型
  enabled: boolean; // 是否启用
  permissionType: string; // 权限类型
  description: string; // 智能体描述
  agentConfig: any; // 智能体配置
  tenantId: number; // 租户ID
  status: string; // 智能体描述
};
