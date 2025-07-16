import React, { useMemo } from 'react';
import { Box, VStack, HStack, Text, Divider, Icon, useColorModeValue } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import styles from './index.module.scss';

interface ArticleItem {
  id: number;
  title: string;
  summery: string;
  highlight?: string;
}

interface RealmArticleData {
  moduleTitle: string;
  data: ArticleItem[];
}
interface RealmArticleProps {
  value: string;
}

const RealmArticle: React.FC<RealmArticleProps> = ({ value }) => {
  try {
  } catch (error) {
    console.error('Error parsing RealmArticle data:', error);
    return null;
  }
  //   const o = JSON.parse(value) as RealmArticleData;
  //   const { moduleTitle , data } = o;

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

  const realmArticleData: ArticleItem[] = (data as ArticleItem[]) || [];
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const titleColor = useColorModeValue('gray.900', 'white');
  const summeryColor = useColorModeValue('gray.700', 'gray.300');
  const highlightColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box
      bg={bgColor}
      className={`realm-article-container ${styles['realm-article-container']}`}
      p={4}
    >
      {/* 标题 */}
      <Text fontSize="lg" fontWeight="bold" color={titleColor} mb={4}>
        {moduleTitle}
      </Text>

      {/* 文章列表 */}
      <VStack spacing={4} align="stretch">
        {realmArticleData.map((article, index) => (
          <Box key={article.id}>
            {/* 文章项 */}
            <VStack spacing={2} align="stretch">
              {/* 标题行 */}
              <HStack justify="space-between" align="center">
                <HStack spacing={2} flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color={titleColor} noOfLines={1}>
                    {article.id}. {article.title}
                  </Text>
                </HStack>
                <Icon as={ChevronRightIcon} color="gray.400" boxSize={4} />
              </HStack>

              {/* 内容 */}
              <Text
                fontSize="sm"
                sx={{ marginTop: '0 !important', marginBottom: '0 !important' }}
                color={summeryColor}
                lineHeight="1.5"
              >
                {article.summery}
                {/* 高亮数字 */}
                {article.highlight &&
                  article.highlight.split(' ').map((num, idx) => (
                    <Text
                      as={'span'}
                      key={idx}
                      fontSize="xs"
                      color={highlightColor}
                      fontWeight="medium"
                    >
                      {num}
                    </Text>
                  ))}
              </Text>
            </VStack>

            {/* 分隔线 */}
            {index < realmArticleData.length - 1 && <Divider mt={4} borderColor={borderColor} />}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default RealmArticle;
