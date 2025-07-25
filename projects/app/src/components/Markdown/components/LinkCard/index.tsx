import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import CardSkeleton from '../ContentCard/CardSkeleton';
import { useStyleConfig } from '../../styles/styleUtils';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
// "url": "",
// 			"title": "净值播报1",
// 			"id": 1,
// 			"icon": "https:\/\/www.huaan.com.cn\/upload2010\/2021\/12\/23\/073812936_0_537292b2-917e-3c6c-a4ac-b1ff3a557947.png"
interface LinkCardItem {
  title: string;
  id: number;
  url: string;
  icon: string;
}

interface LinkCardProps {
  value: string;
  isHistory?: boolean;
}

// 骨架屏组件

const LinkCard = ({ value, isHistory = false }: LinkCardProps) => {
  const { agentConfigInfo } = useChatStore();
  const chatItemConfig = agentConfigInfo?.agentConfig?.chatItemConfig || {};
  const cardAIBg = chatItemConfig?.cardAIBg || '#ffffff';
  const styles = useStyleConfig();

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
  const [visibleItems, setVisibleItems] = useState<LinkCardItem[]>([]);

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
    <Box
      className={`video-card-container ${styles['chat-cus-card-style']}`}
      bg={cardAIBg}
      mb={2}
      mt={4}
    >
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
        {/* 链接卡片list */}
        <Flex flexWrap="nowrap" gap="12px">
          {data.map((item: LinkCardItem) => (
            // <Link key={item.id} href={item.url} isExternal _hover={{ textDecoration: 'none' }}>
            <Flex
              key={item.id}
              direction="column"
              alignItems="center"
              width="74px"
              height="74px"
              background="#F5F7FA"
              borderRadius="12px"
              padding="12px 0"
            >
              <Box height="28px" width="28px" mb="6px">
                <Image
                  src={item.icon}
                  alt={item.title}
                  width="100%"
                  height="100%"
                  objectFit="contain"
                />
              </Box>
              <Text
                as="span"
                fontWeight="400"
                fontSize="12px"
                color="#1A1A1A"
                lineHeight="17px"
                textAlign="center"
                noOfLines={1}
              >
                {item.title}
              </Text>
            </Flex>
            // </Link>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
};

export default LinkCard;
