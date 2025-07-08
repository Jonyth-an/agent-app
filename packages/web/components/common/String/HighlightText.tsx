import { Box } from '@chakra-ui/react';
import React from 'react';

const HighlightText = ({
  rawText,
  matchText,
  color = 'primary.600'
}: {
  rawText: string;
  matchText: string;
  color?: string;
}) => {
  let parts: string[] = [rawText]; // 默认值，如果正则表达式失败，则显示原始文本
  
  try {
    // 转义正则表达式中的特殊字符
    const escapedMatchText = matchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedMatchText})`, 'gi');
    parts = rawText.split(regex);
    console.log('ccc parts', parts);
  } catch (error) {
    // 如果正则表达式构造或分割出错，记录错误但不影响渲染
    console.error('HighlightText regex error:', error);
    // parts已经有默认值，所以这里不需要额外处理
  }
  
  return (
    <Box>
      {parts.map((part, index) => {
        let highLight = false;
        
        try {
          highLight = part.toLowerCase() === matchText.toLowerCase();

          if (highLight) {
            parts.find((item, i) => {
              if (i >= index) return;
              if (item.toLowerCase() === matchText.toLowerCase()) {
                highLight = false;
              }
            });
          }
        } catch (error) {
          // 如果比较过程中出错，不高亮显示
          console.error('HighlightText comparison error:', error);
          highLight = false;
        }

        return (
          <Box as="span" key={index} color={highLight ? color : 'inherit'}>
            {part}
          </Box>
        );
      })}
    </Box>
  );
};

export default HighlightText;
