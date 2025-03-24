import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { StoreNodeItemType } from '@fastgpt/global/core/workflow/type/node.d';
import { NodeInputKeyEnum } from '@fastgpt/global/core/workflow/constants';
import { getWebLLMModel } from '@/web/common/system/utils';
import dayjs from 'dayjs';
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
/**
 * 获取当前时间戳
 * @returns 时间戳（毫秒）
 */
export const getCurrentTimestamp = (): string => {
  return dayjs().valueOf() + '';
};
/**
 * 将指定格式的时间字符串转换为时间戳
 * @param timeStr 时间字符串，格式如："2025-03-22 18:03:37 Saturday"
 * @returns 时间戳（毫秒）
 */
export const convertTimeToTimestamp = (timeStr: string): string => {
  try {
    if (!timeStr) {
      return getCurrentTimestamp();
    }
    const cleanDateString = timeStr.split(' ')[0] + ' ' + timeStr.split(' ')[1];
    return dayjs(cleanDateString).valueOf() + '';
  } catch (error) {
    console.error('时间转换失败：', error);
    return getCurrentTimestamp();
  }
};
