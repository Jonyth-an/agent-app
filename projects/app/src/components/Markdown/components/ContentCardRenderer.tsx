import React from 'react';
import ContentCard from './ContentCard';
import { processContentCardData, isContentCardJson } from '../utils';

interface ContentCardRendererProps {
  value: string;
  children?: React.ReactNode; // 添加children属性
  isHistory?: boolean;
}

const ContentCardRenderer = ({ value, children, isHistory = false }: ContentCardRendererProps) => {
  // 处理children，如果children存在且是字符串，优先使用children
  let contentValue = value;

  if (children) {
    // 如果children是字符串，直接使用
    if (typeof children === 'string') {
      contentValue = children;
    }
    // 如果children是数组，尝试将其连接成字符串
    else if (Array.isArray(children)) {
      contentValue = children.map((child) => (typeof child === 'string' ? child : '')).join('');
    }
    // 如果children是React元素，尝试获取其文本内容
    else if (React.isValidElement(children)) {
      const childProps = children.props;
      if (childProps.children && typeof childProps.children === 'string') {
        contentValue = childProps.children;
      }
    }
  }

  try {
    // 尝试解析JSON数据
    const parsedData = JSON.parse(contentValue);

    // 检查是否符合ContentCard数据格式
    if (parsedData.type === 'RENDER_CONTENT_CARD' && Array.isArray(parsedData.data)) {
      return <ContentCard items={parsedData.data} isHistory={isHistory} />;
    }
  } catch (error) {
    // 解析失败，尝试使用旧版本格式解析
  }

  // 尝试使用旧版本格式解析
  const items = processContentCardData(contentValue);
  if (items.length > 0) {
    return <ContentCard items={items} isHistory={isHistory} />;
  }

  // 如果都解析失败，返回原始内容
  return <pre>{contentValue}</pre>;
};

export default ContentCardRenderer;
