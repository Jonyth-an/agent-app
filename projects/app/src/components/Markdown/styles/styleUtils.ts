import { useMemo } from 'react';
import defaultStyles from './default.module.scss';
import huaanStyles from './huaan.module.scss';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { BoxProps } from '@chakra-ui/react';
import { ChatRoleEnum } from '@fastgpt/global/core/chat/constants';

export enum StyleTypeEnum {
  default = 'default',
  huaan = 'huaan'
}

/**
 * 获取当前应该使用的样式类型
 * @param styleType 可选的样式类型参数
 * @returns 当前应使用的样式类型
 */
export const useCurrentStyleType = (styleType?: StyleTypeEnum): StyleTypeEnum => {
  // 从 store 获取样式类型
  const storeStyleType = useChatStore(
    (state: any) => state?.agentConfigInfo.agentConfig?.commonConfig?.styleType
  );

  // 优先使用传入的 styleType，如果没有则使用 store 中的值
  return styleType || storeStyleType || 'default';
};

/**
 * 获取样式配置
 * @param styleType 可选的样式类型参数，如果提供则优先使用，否则从 store 获取
 * @returns 对应的样式对象
 */
export const useStyleConfig = () => {
  const currentStyleType = useCurrentStyleType();
  console.log('mmm useStyleConfig currentStyleType', currentStyleType);
  return useMemo(() => {
    if (currentStyleType === StyleTypeEnum.huaan) {
      return huaanStyles;
    }
    return defaultStyles;
  }, [currentStyleType]);
};

// 默认样式的消息卡片
export const defaultMessageCardStyle: BoxProps = {
  px: 4,
  py: 3,
  borderRadius: '0 8px 8px 8px',
  boxShadow: 'none',
  display: 'inline-block',
  maxW: ['calc(100% - 25px)', 'calc(100% - 40px)'],
  color: 'myGray.900'
};

// 华安样式的消息卡片
export const huaanMessageCardStyle: BoxProps = {
  px: 4,
  py: 3,
  borderRadius: '0 8px 8px 8px',
  boxShadow: 'none',
  display: 'inline-block',
  maxW: ['calc(100%)', 'calc(100%)'],
  color: 'myGray.900'
};

/**
 * 根据样式类型获取消息卡片样式
 * @param styleType 可选的样式类型参数，如果提供则优先使用，否则从 store 获取
 * @returns 对应的消息卡片样式
 */
export const MessageCardStyle = (): BoxProps => {
  // 使用公共逻辑获取当前样式类型
  const currentStyleType = useCurrentStyleType();
  console.log('mmm  MessageCardStyle currentStyleType', currentStyleType);
  // 根据样式类型返回对应的消息卡片样式
  if (currentStyleType === StyleTypeEnum.huaan) {
    return huaanMessageCardStyle;
  }
  return defaultMessageCardStyle;
};

//  default: defaultClass,
// huaan: huaanClass,
// xingying: otherClass
export const getStyleClass = (options: Record<StyleTypeEnum, any>) => {
  // 使用公共逻辑获取当前样式类型
  const currentStyleType = useCurrentStyleType();

  // 如果提供了当前样式类型的 class，则返回它
  if (currentStyleType && options[currentStyleType]) {
    return options[currentStyleType];
  }

  // 如果没有找到对应的 class，则返回默认样式
  return options.default || '';
};

export type IHandlerTypeShape = Record<HandlerType, any>;

export const huaanHandlerMap: IHandlerTypeShape = {
  showHumanController: false // 是否显示用户控制器
};

export const defaultHandlerMap: IHandlerTypeShape = {
  showHumanController: true // 是否显示用户控制器
};

export enum HandlerType {
  showHumanController = 'showHumanController'
}
export const getHandlerStatus = (handlerType: HandlerType) => {
  const currentStyleType = useCurrentStyleType();
  let map = {};
  if (currentStyleType === StyleTypeEnum.huaan) {
    map = huaanHandlerMap;
  } else {
    map = defaultHandlerMap;
  }
  return (map as IHandlerTypeShape)[handlerType];
};
