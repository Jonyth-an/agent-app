import { Box, Flex, Text, useTheme, Image } from '@chakra-ui/react';
import { useMemo } from 'react';

export interface CardItem {
  icon: string;
  name: string;
  url: string;
}

// const { agentConfigInfo } = useChatStore();
// const agentConfig = agentConfigInfo?.agentConfig || {};
// // console.log('xxx agentConfig', agentConfig);
// const cardList = (agentConfig && agentConfig.list) || [];
// console.log('xxx cardList', cardList);
// useEffect(() => {
//   const { agentConfigInfo } = useChatStore();
//   const agentConfig = agentConfigInfo?.agentConfig || {};
//   // console.log('xxx agentConfig', agentConfig);
//   const cardList = (agentConfig && agentConfig.list) || [];
//   console.log('xxx cardList', cardList);
// }, []);

const CardList = ({ cardItems }: { cardItems: CardItem[] }) => {
  const theme = useTheme();
  // const { agentConfigInfo } = useChatStore();

  // const cardItems: CardItem[] = useMemo(() => {
  //   const agentConfig = agentConfigInfo?.agentConfig || {};
  //   const cardList = (agentConfig && agentConfig.list) || [];
  //   console.log('xxx cardList', cardList);
  //   return cardList;
  // }, [agentConfigInfo]);

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
          '-ms-overflow-style': 'none'
        }}
      >
        {cardItems.map((item, index) => (
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
            onClick={() => (window.location.href = item.url)} // 添加点击事件
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
              {item.name}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default CardList;
