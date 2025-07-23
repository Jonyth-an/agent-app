import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { Box, Flex, Text, useTheme, Image } from '@chakra-ui/react';
import { RunPlatformEnum } from '@fastgpt/global/core/chat/constants';
import { useMemo } from 'react';

export interface EntryItem {
  icon?: string;
  name: string;
  url: string;
  summary?: string; // 添加二级标题字段
}

interface StyleConfig {
  itemBgColor?: string; // 选项背景色
  itemBorderRadius?: string; // 选项圆角
  containerBgColor?: string; // 区域背景色
  containerShadow?: string; // 区域顶部外阴影色
  titleFontSize?: string; // 一级标题字体大小
  titleColor?: string; // 一级标题颜色
  summaryFontSize?: string; // 二级标题字体大小
  summaryColor?: string; // 二级标题颜色
}

const HuaanEntryList = ({ entryItems }: { entryItems: EntryItem[] }) => {
  const { agentConfigInfo, runPlatform } = useChatStore();
  const card_config = agentConfigInfo.agentConfig.miniprogram.card_config || {};
  const miniPath = card_config && card_config.miniPath;
  const listStyle = agentConfigInfo?.agentConfig?.listStyle || {};

  // 默认样式配置
  //   const defaultStyle: StyleConfig = {
  //     containerBgColor: 'transparent',
  //     containerShadow: 'none',
  //     itemBgColor: '#ffffff',
  //     itemBorderRadius: '10px',
  //     titleFontSize: '13px',
  //     titleColor: '#1A1A1A',
  //     summaryFontSize: '11px',
  //     summaryColor: '#99999'
  //   };

  // 合并默认样式和自定义样式
  const style = { ...listStyle };

  const clickCard = (item: EntryItem) => {
    if (runPlatform === RunPlatformEnum.MINI_PROGRAM) {
      const url = `${miniPath}?url=${encodeURIComponent(item.url)}`;
      console.log('xxx clickCard url', url);
      wx.miniProgram.navigateTo({
        url
      });
    } else {
      window.location.href = item.url;
    }
  };

  return (
    <Box
      className="entry-list-wrapper"
      width="100%"
      position="relative"
      px={3}
      py={2}
      bg={style.containerBgColor}
      //   boxShadow={style.containerShadow}
    >
      <Flex
        overflowX="auto"
        gap={2} // 间距调整
        css={{
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {entryItems.map((item, index) => (
          <Flex
            key={index}
            direction="column" // 垂直排列
            px={'12px'}
            py={'10px'}
            justifyContent="center"
            alignItems="flex-start"
            bg={style.itemBgColor}
            borderRadius={style.itemBorderRadius}
            cursor="pointer"
            transition="all 0.2s"
            onClick={() => clickCard(item)}
          >
            <Text
              fontSize={style.titleFontSize}
              fontWeight="medium"
              lineHeight={'18px'}
              color={style.titleColor}
              textAlign="center"
              whiteSpace="nowrap"
            >
              {item.name}
            </Text>
            {item.summary && (
              <Text
                lineHeight={'16px'}
                fontSize={style.summaryFontSize}
                color={style.summaryColor}
                mt={'2px'}
                textAlign="center"
                whiteSpace="nowrap"
              >
                {item.summary}
              </Text>
            )}
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default HuaanEntryList;
