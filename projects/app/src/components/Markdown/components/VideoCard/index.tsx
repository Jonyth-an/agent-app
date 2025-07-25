import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import CardSkeleton from '../ContentCard/CardSkeleton';
import { useStyleConfig } from '../../styles/styleUtils';
import { useChatStore } from '@/web/core/chat/context/useChatStore';

interface VideoCardItem {
  id: number;
  title: string;
  summary: string;
  avatar: string;
  url: string;
  dateTime?: string;
}

interface VideoCardData {
  moduleTitle: string;
  data: VideoCardItem[];
}

interface VideoCardProps {
  value: string;
  isHistory?: boolean;
}

// 骨架屏组件

const VideoCard = ({ value, isHistory = false }: VideoCardProps) => {
  const { agentConfigInfo } = useChatStore();
  const chatItemConfig = agentConfigInfo?.agentConfig?.chatItemConfig || {};
  const cardAIBg = chatItemConfig?.cardAIBg || '#ffffff';
  const styles = useStyleConfig();
  const parsedData = useMemo(() => {
    try {
      const o = JSON.parse(value);
      return {
        moduleTitle: o?.moduleTitle ?? '',
        titleOfLines: o?.titleOfLines || 1,
        data: Array.isArray(o?.data) ? o.data : []
      };
    } catch (error) {
      console.error('Error parsing RealmArticle data:', error);
      return { moduleTitle: '', data: [], titleOfLines: 1 };
    }
  }, [value]);
  const { moduleTitle, data, titleOfLines } = parsedData;
  const [visibleItems, setVisibleItems] = useState<VideoCardItem[]>([]);

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
  // const styles = useStyleConfig();

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
              <Flex alignItems="start" gap={4} borderRadius="md" transition="background 0.2s">
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
                      marginBottom: `${titleOfLines === 2 ? '4px !important' : '2px !important'}`
                    }}
                    noOfLines={titleOfLines}
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

                  {item.dateTime && (
                    <Text
                      as="div"
                      fontSize="12px"
                      lineHeight={'18px'}
                      sx={{
                        marginTop: '7px !important',
                        marginBottom: '0px !important'
                      }}
                      noOfLines={1}
                      color="#999999"
                    >
                      {item.dateTime}
                    </Text>
                  )}
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

export default VideoCard;
