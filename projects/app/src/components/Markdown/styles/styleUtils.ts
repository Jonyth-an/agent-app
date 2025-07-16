import { useMemo } from 'react';
import defaultStyles from './default.module.scss';
import huaanStyles from './huaan.module.scss';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { BoxProps } from '@chakra-ui/react';

// 样式类型定义
export type StyleType = 'default' | 'huaan' | string;

/**
 * 获取当前应该使用的样式类型
 * @param styleType 可选的样式类型参数
 * @returns 当前应使用的样式类型
 */
export const useCurrentStyleType = (styleType?: StyleType) => {
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
export const useStyleConfig = (styleType?: StyleType) => {
  const currentStyleType = useCurrentStyleType(styleType);

  return useMemo(() => {
    if (currentStyleType === 'huaan') {
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
  maxW: ['calc(100% - 25px)', 'calc(100% - 40px)'],
  color: 'myGray.900'
};

/**
 * 根据样式类型获取消息卡片样式
 * @param styleType 可选的样式类型参数，如果提供则优先使用，否则从 store 获取
 * @returns 对应的消息卡片样式
 */
export const MessageCardStyle = (styleType?: StyleType): BoxProps => {
  // 使用公共逻辑获取当前样式类型
  const currentStyleType = useCurrentStyleType(styleType);

  // 根据样式类型返回对应的消息卡片样式
  if (currentStyleType === 'huaan') {
    return huaanMessageCardStyle;
  }
  return defaultMessageCardStyle;
};
