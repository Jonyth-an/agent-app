import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import CardSkeleton from '../ContentCard/CardSkeleton';

interface FundManagerCardItem {
  summary: string;
  postTime: string;
  postTimeTitle: string;
  fundMgrName: string;
  fundMgrNameTitle: string;
  manageScaleTitle: string;
  manageScaleText: string;
  id: number;
  url: string;
  avatar: string;
}

interface FundManagerCardProps {
  value: string;
  isHistory?: boolean;
}

// 骨架屏组件

const FundManagerCard = ({ value, isHistory = false }: FundManagerCardProps) => {
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
  const [visibleItems, setVisibleItems] = useState<FundManagerCardItem[]>([]);

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
    <Box className={`video-card-container`} bgColor="white" mb={2} mt={4}>
      <Text
        as={'div'}
        fontSize="18px"
        fontWeight="600"
        lineHeight="28px"
        color="#1A1A1A"
        sx={{ marginBottom: '12px !important' }}
      >
        {moduleTitle}
      </Text>
      <Flex direction="column" gap={3}>
        {/* 基金经理卡片list */}
      </Flex>
    </Box>
  );
};

export default FundManagerCard;
