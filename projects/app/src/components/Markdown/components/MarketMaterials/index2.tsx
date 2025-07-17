import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import CardSkeleton from '../ContentCard/CardSkeleton';

interface FundListItem {
  id: number;
  fundName: string;
  fundCode: string;
  last1YRange: string;
  last1YRangeTitle: string;
  fundType: string[];
}
interface MaterialItem {
  id: number;
  title: string;
  summary: string;
  avatar: string;
  url: string;
  fundList: FundListItem[];
}

interface MaterialData {
  moduleTitle: string;
  data: MaterialItem[];
}

interface MarketMaterialsProps {
  value: string;
  isHistory?: boolean;
}

// 骨架屏组件

const MarketMaterials = ({ value, isHistory = false }: MarketMaterialsProps) => {
  const parsedData = useMemo(() => {
    try {
      const o = JSON.parse(value);
      return {
        moduleTitle: o?.moduleTitle ?? '',
        data: Array.isArray(o?.data) ? o.data : []
      };
    } catch (error) {
      console.error('Error parsing RealmArticle data:', error);
      return { moduleTitle: '', data: [] };
    }
  }, [value]);
  const { moduleTitle, data } = parsedData;
  const [visibleItems, setVisibleItems] = useState<MaterialItem[]>([]);

  useEffect(() => {
    setVisibleItems([]); // 重置状态
    if (data.length === 0) return;

    if (isHistory) {
      setVisibleItems([...data]);
      return;
    }

    const interval = data.length < 5 ? 1000 : data.length < 12 ? 600 : 400;
    const itemsMap = new Map();
    let currentIndex = 0;

    // 创建定时器逐个显示内容
    const timer = setInterval(() => {
      if (currentIndex < data.length) {
        const item = data[currentIndex];
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
  }, [data, isHistory]);

  if (data.length === 0 || visibleItems.length === 0) {
    return <CardSkeleton />;
  }

  return (
    <Box bgColor="white">
      <Text
        as={'div'}
        fontSize="18px"
        fontWeight="600"
        lineHeight="28px"
        color="#1A1A1A"
        sx={{ marginBottom: '8px !important' }}
      >
        {moduleTitle}
      </Text>
      <Flex direction="column" gap={3}>
        {visibleItems.map((item, index) => (
          <React.Fragment key={`${item.id}_${index}`}>
            <Link
              sx={{
                textDecoration: 'none!important'
              }}
              href={item.url}
              isExternal
              _hover={{ textDecoration: 'none' }}
            >
              <Flex alignItems="start" gap={3} borderRadius="md" transition="background 0.2s">
                <Box flexShrink={0} width="79px" height="67px" overflow="hidden" borderRadius="md">
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
                    as="div"
                    fontSize="14px"
                    fontWeight="medium"
                    lineHeight={'22px'}
                    sx={{
                      marginTop: '0 !important',
                      marginBottom: '4px !important'
                    }}
                    noOfLines={2}
                    color="#1A1A1A"
                  >
                    {item.title}
                  </Text>
                  <Text
                    as="div"
                    fontSize="12px"
                    lineHeight={'18px'}
                    sx={{
                      marginTop: '0 !important',
                      marginBottom: '0 !important'
                    }}
                    noOfLines={1}
                    color="#999999"
                  >
                    {item.summary}
                  </Text>
                </Box>
              </Flex>

              {/* 产品组件 */}
            </Link>
            {index < visibleItems.length - 1 && (
              <Box height="1px" bg="gray.200" opacity="0.6" width="100%" my={0} />
            )}
          </React.Fragment>
        ))}
      </Flex>
    </Box>
  );
};

export default MarketMaterials;
