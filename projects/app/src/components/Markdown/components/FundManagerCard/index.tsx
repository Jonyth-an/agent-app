import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import CardSkeleton from '../ContentCard/CardSkeleton';
import styles from './index.module.scss';

// "summary": "美国伊利诺伊理工大学硕士，证券从业年限10年+，基金投资年限3年+。应届毕业加入华安基金，华安自身培养的基金经理，先后深度跟踪汽车、家电、建筑行業，历任制造组组长，消费组组长。",
// "postTime": "13年",
// "postTimeTitle": "从业时间",
// "fundMgrName": "王斌",
// "fundMgrNameTitle": "华安基金",
// "manageScaleTitle": "管理规模",
// "manageScaleText": "1152.56亿",
// "id": 3211595929007921,
// "url": "",
// "avatar": "https:\/\/www.huaan.com.cn\/upload2010\/2021\/12\/23\/073812936_0_537292b2-917e-3c6c-a4ac-b1ff3a557947.png"
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

interface FundManagerCardData {
  moduleTitle: string;
  data: FundManagerCardItem[];
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
    <Box
      className={`fund-manager-card-container ${styles['fund-manager-card-container']}`}
      bgColor="white"
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
          <Box
            key={`${item.id}_${index}`}
            borderRadius="8px"
            bg="linear-gradient( 180deg, #EFF6FF 0%, #FAFCFF 100%)"
            p={3.5}
            position="relative"
          >
            <Flex>
              {/* 左侧头像 */}
              <Box width="44px" height="44px" mr={2} flexShrink={0}>
                <Image
                  src={item.avatar || '/placeholder.svg'}
                  alt={item.fundMgrName}
                  borderRadius="full"
                  width="100%"
                  height="100%"
                  objectFit="cover"
                />
              </Box>
              <Flex flex={1} direction="row" justifyContent={'space-between'} alignItems="center">
                {/* 中间区域：姓名和公司 */}
                <Box>
                  <Flex direction="column" height="100%" justifyContent="center">
                    <Text as={'div'} className={styles['info-text']}>
                      {item.fundMgrName}
                    </Text>
                    <Text as={'div'} className={styles['info-title1']}>
                      {item.fundMgrNameTitle}
                    </Text>
                  </Flex>
                </Box>

                {/* 右侧区域：管理规模和从业时间 */}
                <Flex direction="column" alignItems="center">
                  <Text as={'div'} className={styles['info-text']}>
                    {item.manageScaleText}
                  </Text>
                  <Text as={'div'} className={styles['info-title2']}>
                    {item.manageScaleTitle}
                  </Text>
                </Flex>

                <Flex direction="column" alignItems="center">
                  <Text as={'div'} className={styles['info-text']}>
                    {item.postTime}
                  </Text>
                  <Text as={'div'} className={styles['info-title2']}>
                    {item.postTimeTitle}
                  </Text>
                </Flex>
              </Flex>
            </Flex>

            {/* 底部从业经验 */}
            <Box mt={3}>
              <Text as={'div'} className={styles['summary-text']}>
                {item.summary}
              </Text>
            </Box>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default FundManagerCard;
