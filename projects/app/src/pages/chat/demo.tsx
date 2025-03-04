import type React from 'react';
import { Box } from '@chakra-ui/react';
// import ContentCard from '@/components/Markdown/contentCard';

const Demo: React.FC = () => {
  const items = [
    {
      id: '1',
      title:
        '测试title1测试title1测试title1测试title1测试title1测试title1测试title1测试title1测试...',
      imageUrl: '/placeholder.svg?height=80&width=80',
      link: 'https://example.com/1'
    },
    {
      id: '2',
      title:
        '测试title2测试title2测试title2测试title2测试title2测试title2测试title2测试title2测试...',
      imageUrl: '/placeholder.svg?height=80&width=80',
      link: 'https://example.com/2'
    },
    {
      id: '3',
      title:
        '测试title3测试title3测试title3测试title3测试title3测试title3测试title3测试title3测试...',
      imageUrl: '/placeholder.svg?height=80&width=80',
      link: 'https://example.com/3'
    }
  ];

  return (
    <Box maxWidth="md" mx="auto" p={4}>
      {/* <ContentCard items={items} maxItems={5} /> */}
    </Box>
  );
};

export default Demo;
