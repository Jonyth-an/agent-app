import type React from 'react';
import { Box, Flex, Text, Link, Image, Divider } from '@chakra-ui/react';

interface ContentItem {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
}

interface ContentCardProps {
  items: ContentItem[];
  maxItems?: number;
}

const ContentCard: React.FC<ContentCardProps> = ({ items, maxItems = 3 }) => {
  const displayItems = items.slice(0, maxItems);

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} bgColor={'white'}>
      {/* <Text fontSize="md" fontWeight="medium" mb={4}>
        以下是你可能的内容：
      </Text> */}
      <Flex direction="column" gap={4}>
        {displayItems.map((item, index) => (
          <>
            <Link key={item.id} href={item.link} isExternal _hover={{ textDecoration: 'none' }}>
              <Flex
                alignItems="start"
                gap={4}
                borderRadius="md"
                transition="background 0.2s"
                _hover={{ bg: 'gray.100' }}
              >
                <Box flexShrink={0} width="65px" height="50px" overflow="hidden" borderRadius="md">
                  <Image
                    src={item.imageUrl || '/placeholder.svg'}
                    alt=""
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Text
                    fontSize="14px"
                    noOfLines={2}
                    color="rgb(46, 48, 57)"
                    _groupHover={{ color: 'blue.500' }}
                  >
                    {item.title}
                  </Text>
                </Box>
              </Flex>
            </Link>
            {/* 在最后一个项目后不添加分割线 */}
            {index < displayItems.length - 1 && <Divider borderColor="gray.200" />}
          </>
        ))}
      </Flex>
    </Box>
  );
};

export default ContentCard;
