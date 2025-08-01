import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import { ContentItem, useLinkClick } from '../../utils';
import CardSkeleton from './CardSkeleton';

interface ContentCardProps {
  items: ContentItem[];
  maxItems?: number;
  isHistory?: boolean;
}

const ContentCard = ({ items = [], maxItems = 10, isHistory = false }: ContentCardProps) => {
  const [visibleItems, setVisibleItems] = useState<ContentItem[]>([]);
  const { handleLinkClick } = useLinkClick();
  useEffect(() => {
    setVisibleItems([]); // 重置状态
    if (items.length === 0) return;

    if (isHistory) {
      setVisibleItems([...items]);
      return;
    }

    const interval = items.length < 5 ? 1000 : items.length < 12 ? 600 : 400;
    const itemsMap = new Map();
    let currentIndex = 0;

    // 创建定时器逐个显示内容
    const timer = setInterval(() => {
      if (currentIndex < items.length) {
        const item = items[currentIndex];
        // 使用 id 作为键，确保唯一性
        itemsMap.set(item.id, item);
        // 将 Map 值转换为数组设置状态
        setVisibleItems(Array.from(itemsMap.values()));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [items, isHistory]);

  if (items.length === 0 || visibleItems.length === 0) {
    return <CardSkeleton />;
  }

  return (
    <Box
      className={`content-card-container`}
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bgColor="white"
    >
      <Flex direction="column" gap={3}>
        {visibleItems.slice(0, maxItems).map((item, index) => (
          <React.Fragment key={`${item.id}_${index}`}>
            <Box
              sx={{
                textDecoration: 'none!important'
              }}
              onClick={() => {
                handleLinkClick(item.url);
              }}
            >
              <Flex alignItems="start" gap={3} borderRadius="md" transition="background 0.2s">
                <Box flexShrink={0} width="65px" height="50px" overflow="hidden" borderRadius="md">
                  <Image
                    src={item.avatar || '/placeholder.svg'}
                    alt={item.title}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Text
                    fontSize="14px"
                    sx={{
                      marginTop: '0 !important',
                      marginBottom: '0 !important'
                    }}
                    noOfLines={2}
                    color="rgb(46, 48, 57)"
                  >
                    {item.title}
                  </Text>
                </Box>
              </Flex>
            </Box>
            {index < visibleItems.length - 1 && (
              <Box height="1px" bg="gray.200" opacity="0.6" width="100%" my={0} />
            )}
          </React.Fragment>
        ))}
      </Flex>
    </Box>
  );
};

export default ContentCard;
