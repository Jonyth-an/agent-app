import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { StoreNodeItemType } from '@fastgpt/global/core/workflow/type/node.d';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { NodeInputKeyEnum } from '@fastgpt/global/core/workflow/constants';
import { getWebLLMModel } from '@/web/common/system/utils';
import { share_h5_url } from '@/config';

export function checkChatSupportSelectFileByChatModels(models: string[] = []) {
  for (const model of models) {
    const modelData = getWebLLMModel(model);
    if (modelData?.vision) {
      return true;
    }
  }
  return false;
}

export function checkChatSupportSelectFileByModules(modules: StoreNodeItemType[] = []) {
  const chatModules = modules.filter(
    (item) =>
      item.flowNodeType === FlowNodeTypeEnum.chatNode ||
      item.flowNodeType === FlowNodeTypeEnum.tools
  );
  const models: string[] = chatModules.map(
    (item) => item.inputs.find((item) => item.key === 'model')?.value || ''
  );
  return checkChatSupportSelectFileByChatModels(models);
}

export function getAppQuestionGuidesByModules(modules: StoreNodeItemType[] = []) {
  const systemModule = modules.find((item) => item.flowNodeType === FlowNodeTypeEnum.systemConfig);
  const chatInputGuide = systemModule?.inputs.find(
    (item) => item.key === NodeInputKeyEnum.chatInputGuide
  )?.value;

  return chatInputGuide?.open ? chatInputGuide?.textList : [];
}

export function getAppQuestionGuidesByUserGuideModule(
  module: StoreNodeItemType,
  qGuideText: string[] = []
) {
  const chatInputGuide = module?.inputs.find(
    (item) => item.key === NodeInputKeyEnum.chatInputGuide
  )?.value;

  return chatInputGuide?.open ? qGuideText : [];
}

export type RedirectAuthParams = {
  appId: string;
  tenantId: number;
  isEmptyPage?: boolean;
};

export function redirectAuth({ isEmptyPage, appId, tenantId }: RedirectAuthParams) {
  const curUrl = `${share_h5_url}/share-agent/chat?appId=${appId}&dev=12345678`;
  const encodedCurUrl = encodeURIComponent(curUrl);
  const queryParams = new URLSearchParams(window.location.search);
  console.log("queryParams.get('debugger')", queryParams.get('debugger'));
  if (queryParams.get('debugger') == 'nb1234') {
    debugger;
    return false;
  }
  if (isEmptyPage) {
    const emptyUrl = `${share_h5_url}/share/error?tenantId=${tenantId}&redirect=${encodedCurUrl}`;
    console.error('xxx emptyUrl', emptyUrl);
    if (process.env.NODE_ENV !== 'development') {
      window.location.href = emptyUrl;
    }
  } else {
    const loginUrl = `${share_h5_url}/share/advLogin?tenantId=${tenantId}&redirect=${curUrl}`;
    const authorizeUrl = `${share_h5_url}/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=${encodeURIComponent(loginUrl)}`;
    console.error('xxx loginUrl', loginUrl);
    console.error('xxx loginUrl authorizeUrl', authorizeUrl);
    if (process.env.NODE_ENV !== 'development') {
      window.location.href = authorizeUrl;
    }
  }
}
