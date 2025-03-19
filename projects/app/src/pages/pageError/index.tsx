import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Button, Image, useTheme } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextHead from '@/components/common/NextHead';

const PageError = () => {
  const router = useRouter();
  const theme = useTheme();
  const [errorInfo, setErrorInfo] = useState({
    code: '',
    message: ''
  });

  useEffect(() => {
    if (router.isReady) {
      const { code, message } = router.query;
      setErrorInfo({
        code: (code as string) || '',
        message: decodeURIComponent((message as string) || '') || '系统暂时无法访问，请稍后再试'
      });
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <NextHead title="出错啦" />
      <Flex minH="100vh" alignItems="center" justifyContent="center" bg="gray.50" p={4}>
        <Box maxW="600px" w="100%" bg="white" borderRadius="lg" p={8} boxShadow="sm">
          <Flex direction="column" alignItems="center" textAlign="center">
            {/* <Image 
              src="/images/error.svg" 
              alt="Error" 
              width={200} 
              height={200} 
              mb={6}
            /> */}

            <Text fontSize="2xl" fontWeight="bold" color="gray.700" mb={2}>
              抱歉，出现了一些问题
            </Text>

            <Text fontSize="md" color="gray.500" mb={6} maxW="400px">
              {errorInfo.message}
              {errorInfo.code && (
                <Text as="span" fontSize="sm" ml={1}>
                  （错误码：{errorInfo.code}）
                </Text>
              )}
            </Text>

            <Flex gap={4}>
              <Button variant="outline" onClick={() => router.back()}>
                返回上一页
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

export default PageError;
