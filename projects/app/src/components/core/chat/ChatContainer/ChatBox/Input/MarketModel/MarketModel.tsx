import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { Box, Flex, Text, useTheme, Image } from '@chakra-ui/react';
import { RunPlatformEnum } from '@fastgpt/global/core/chat/constants';
import { useMemo } from 'react';

export interface EntryItem {
  icon: string;
  name: string;
  url: string;
}

const EntryList = ({ EntryItems }: { EntryItems: EntryItem[] }) => {
  const { agentConfigInfo, runPlatform } = useChatStore();
  const card_config = agentConfigInfo.agentConfig.miniprogram.card_config || {};
  const miniPath = card_config && card_config.miniPath;

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
    <Box width="100%" position="relative" px={4} py={2}>
      <Flex
        overflowX="auto"
        gap={4}
        css={{
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none' // 修改这里：从 '-ms-overflow-style' 改为 'msOverflowStyle'
        }}
      >
        {EntryItems.map((item, index) => (
          <Flex
            key={index}
            minW="auto"
            px={4}
            py={2}
            alignItems="center"
            gap={2}
            bg="gray.50"
            borderRadius="full"
            border="none"
            borderColor="gray.200"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              bg: 'gray.100'
            }}
            onClick={() => clickCard(item)} // 添加点击事件
          >
            <Flex
              alignItems="center"
              justifyContent="center"
              w="1.25rem"
              h="1.25rem"
              borderRadius="full"
              bg="gray.100"
            >
              <Image src={item.icon} alt={item.name} boxSize="1.25rem" objectFit="cover" />
            </Flex>
            <Text fontSize="0.75rem" fontWeight="medium" whiteSpace="nowrap">
              1--{item.name}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default EntryList;
