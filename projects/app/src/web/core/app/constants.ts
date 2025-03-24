import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { AppDetailType } from '@fastgpt/global/core/app/type.d';
import type {
  DingtalkAppType,
  FeishuAppType,
  OutLinkEditType
} from '@fastgpt/global/support/outLink/type.d';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
export const defaultApp: AppDetailType = {
  _id: '',
  name: 'AI',
  type: AppTypeEnum.simple,
  avatar: '/icon/logo.svg',
  intro: '',
  updateTime: new Date(),
  modules: [],
  chatConfig: {},
  teamId: '',
  tmbId: '',
  teamTags: [],
  edges: [],
  version: 'v2',
  permission: new AppPermission(),
  inheritPermission: false
};

export const AgentAccessType = {
  INIT: 'INIT',
  PUBLIC: 'PUBLIC', // 公开
  PRIVATE: 'PRIVATE', // 仅激活用户
  FEE_OR_MEMBERSHIP: 'FEE_OR_MEMBERSHIP', // 单独付费或会员
  EXTRA_FEE: 'EXTRA_FEE' // 额外付费
};

export const LinkTypeEnum = {
  LINK_AUTH: 'LINK_AUTH', // 登陆授权
  LINK_PAY: 'LINK_PAY', // 支付
  LINK_MEMBER: 'LINK_MEMBER', // 会员
  LINK_REDIRECT: 'LINK_REDIRECT' // 跳转链接
};

export const ChatStatusType = {
  INIT_CHAT: 'INIT_CHAT', // 初始化
  CAN_CHAT: 'CAN_CHAT', // 可以聊天
  DISABLE_CHAT: 'DISABLE_CHAT' // 禁止聊天
};

export const defaultOutLinkForm: OutLinkEditType = {
  name: '',
  showNodeStatus: true,
  responseDetail: false,
  showRawSource: false,
  limit: {
    QPM: 100,
    maxUsagePoints: -1
  }
};

export const defaultFeishuOutLinkForm: OutLinkEditType<FeishuAppType> = {
  name: '',
  limit: {
    QPM: 100,
    maxUsagePoints: -1
  }
};

export const defaultDingtalkOutlinkForm: OutLinkEditType<DingtalkAppType> = {
  name: '',
  limit: {
    QPM: 100,
    maxUsagePoints: -1
  }
};

export enum TTSTypeEnum {
  none = 'none',
  web = 'web',
  model = 'model'
}

export const workflowStartNodeId = 'workflowStartNodeId';
