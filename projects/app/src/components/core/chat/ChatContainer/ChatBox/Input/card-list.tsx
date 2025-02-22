import { Box, Flex, Text, useTheme } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';

interface CardItem {
  icon: string;
  label: string;
}

const cardItems: CardItem[] = [
  {
    icon: 'AI',
    label: '展业助手'
  },
  {
    icon: 'AI',
    label: '话术助手'
  },
  {
    icon: 'AI',
    label: '基金亮点挖掘'
  },
  {
    icon: 'AI',
    label: '基金亮点挖掘'
  },
  {
    icon: 'AI',
    label: '基金亮点挖掘'
  }
];

const CardList = () => {
  const theme = useTheme();

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
          >
            <Flex
              alignItems="center"
              justifyContent="center"
              w="20px"
              h="20px"
              borderRadius="full"
              bg="gray.100"
            >
              <MyIcon name={item.icon} width="20px" height="20px" color="gray.600" />
            </Flex>
            <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
              {item.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default CardList;
