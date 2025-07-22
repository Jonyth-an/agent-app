import { StyleTypeEnum, useCurrentStyleType } from '@/components/Markdown/styles/styleUtils';
import { ReactNode } from 'react';

interface ComponentWrapperProps {
  huaanComponent: React.ComponentType<any>;
  defaultComponent: React.ComponentType<any>;
  [key: string]: any;
}

/**
 * 通用样式组件包裹器
 * 根据当前样式类型自动选择对应的组件进行渲染
 */
export default function ComponentWrapper(props: ComponentWrapperProps) {
  const {
    huaanComponent: HuaanComponent,
    defaultComponent: DefaultComponent,
    ...restProps
  } = props;
  const styleType = useCurrentStyleType();

  if (styleType === StyleTypeEnum.huaan) {
    return <HuaanComponent {...restProps} />;
  } else {
    return <DefaultComponent {...restProps} />;
  }
}
