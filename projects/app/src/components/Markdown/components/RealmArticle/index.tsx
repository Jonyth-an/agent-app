import React, { useMemo } from 'react';
import { Box, VStack, HStack, Text, Divider, Icon, useColorModeValue } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import styles from './index.module.scss';

interface ArticleItem {
  id: number;
  title: string;
  summary: string;
  highlight?: string;
  url?: string;
}

interface RealmArticleData {
  moduleTitle: string;
  hideOrder?: boolean;
  data: ArticleItem[];
}
interface RealmArticleProps {
  value: string;
  isHistory?: boolean;
}

const RealmArticle: React.FC<RealmArticleProps> = ({ value }) => {
  const parsedData = useMemo(() => {
    try {
      const o = JSON.parse(value);
      return {
        moduleTitle: o?.moduleTitle ?? '',
        data: Array.isArray(o?.data) ? o.data : [],
        hideOrder: o?.hideOrder ?? false
      };
    } catch (error) {
      console.error('Error parsing RealmArticle data:', error);
      return { moduleTitle: '', data: [], hideOrder: false };
    }
  }, [value]);
  const { moduleTitle, data, hideOrder } = parsedData;

  const realmArticleData: ArticleItem[] = (data as ArticleItem[]) || [];
  const handleArticleClick = (article: ArticleItem) => {
    console.log('Article clicked:', article);
  };

  return (
    <Box className={`realm-article-container ${styles['realm-article-container']}`} my={4}>
      {/* 标题 */}
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

      {/* 文章列表 */}
      <VStack spacing={2} align="stretch">
        {realmArticleData.map((article, index) => (
          <Box key={article.id}>
            {/* 文章项 */}
            <VStack spacing={1} align="stretch">
              {/* 标题行 */}
              <HStack
                justify="space-between"
                align="center"
                onClick={() => handleArticleClick(article)}
              >
                <HStack flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="#1A1A1A" noOfLines={1}>
                    {hideOrder ? '' : <span>{index + 1}、</span>} {article.title}
                  </Text>
                </HStack>
                <Icon as={ChevronRightIcon} color="#1A1A1A" boxSize={5} />
              </HStack>

              {/* 内容 */}
              <Text
                fontSize="sm"
                sx={{ marginTop: '0 !important', marginBottom: '0 !important' }}
                color="#1A1A1A"
                lineHeight="1.5"
              >
                {article.summary}
                {/* 高亮数字 */}
                {article.highlight &&
                  article.highlight.split(' ').map((num, idx) => (
                    <Text as={'span'} key={idx} fontSize="xs" color="#707173" fontWeight="medium">
                      {num}
                    </Text>
                  ))}
              </Text>
            </VStack>

            {/* 分隔线 */}
            {/* {index < realmArticleData.length - 1 && <Divider mt={4} borderColor={borderColor} />} */}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default RealmArticle;
