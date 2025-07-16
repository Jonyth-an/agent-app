import { useMemo } from 'react';
import defaultStyles from './index.module.scss';
import huaanStyles from './huaan.module.scss';
import { useChatStore } from '@/web/core/chat/context/useChatStore';

// 样式类型定义
export type StyleType = 'default' | 'huaan' | string;

/**
 * 获取样式配置
 * @param styleType 可选的样式类型参数，如果提供则优先使用，否则从 store 获取
 * @returns 对应的样式对象
 */
export const useStyleConfig = (styleType?: StyleType) => {
  // 从 store 获取样式类型
  const storeStyleType = useChatStore(
    (state: any) => state?.agentConfigInfo.agentConfig?.commonConfig?.styleType
  );
  return useMemo(() => {
    // 优先使用传入的 styleType，如果没有则使用 store 中的值
    const currentStyleType = styleType || storeStyleType;
    console.log('mmm currentStyleType', currentStyleType);
    // 这里可以根据实际需求添加更多的样式判断逻辑
    if (currentStyleType === 'huaan') {
      return huaanStyles;
    }
    return defaultStyles;
  }, [styleType, storeStyleType]);
};
