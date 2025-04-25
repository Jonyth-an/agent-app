import { useRouter } from 'next/router';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { TrackEventName } from '@/web/common/system/constants';
import { useToast } from '@fastgpt/web/hooks/useToast';
import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Button, Image, useTheme } from '@chakra-ui/react';
import NextHead from '@/components/common/NextHead';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
function Error() {
  const router = useRouter();
  const { toast } = useToast();
  const { lastRoute, llmModelList, embeddingModelList } = useSystemStore();

  const [errorInfo, setErrorInfo] = useState({
    code: '',
    message: ''
  });

  useEffect(() => {
    if (router.isReady) {
      console.log(router.query);
      const { code, message } = router.query;
      setErrorInfo({
        code: (code as string) || '',
        message: decodeURIComponent((message as string) || '') || '系统暂时无法访问，请稍后再试'
      });
    }
  }, [router.isReady, router.query]);
  useEffect(() => {
    setTimeout(() => {
      window.umami?.track(TrackEventName.pageError, {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        appName: navigator.appName,
        lastRoute,
        route: router.asPath
      });
    }, 1000);

    let modelError = false;
    if (llmModelList.length === 0) {
      modelError = true;
      console.error({
        title: '未配置语言模型',
        status: 'error'
      });
    } else if (!llmModelList.some((item) => item.datasetProcess)) {
      modelError = true;
      console.error({
        title: '未配置知识库文件处理模型',
        status: 'error'
      });
    }
    if (embeddingModelList.length === 0) {
      modelError = true;
      console.error({
        title: '未配置索引模型',
        status: 'error'
      });
    }
  }, []);

  return (
    <Box whiteSpace={'pre-wrap'}>
      {/* {`出现未捕获的异常。
1. 私有部署用户，90%是由于模型配置不正确/模型未启用导致。。
2. 部分系统不兼容相关API。大部分是苹果的safari 浏览器导致，可以尝试更换 chrome。 
3. 请关闭浏览器翻译功能，部分翻译导致页面崩溃。

排除3后，打开控制台的 console 查看具体报错信息。
如果提示 xxx undefined 的话，就是模型配置不正确，检查：
1. 请确保系统内每个系列模型至少有一个可用，可以在【账号-模型提供商】中检查。
2. 请确保至少有一个知识库文件处理模型（语言模型中有一个开关），否则知识库创建会报错。
2. 检查模型中一些“对象”参数是否异常（数组和对象），如果为空，可以尝试给个空数组或空对象。
`} */}
      <>
        <NextHead title={errorInfo.message || '出错啦'} />
        <Flex minH="100vh" alignItems="center" justifyContent="center" bg="white" p={4}>
          <Box maxW="600px" w="100%" bg="white" borderRadius="lg" p={8}>
            <Flex direction="column" alignItems="center" textAlign="center">
              <Image
                src={getWebReqUrl('/imgs/pageError.png')}
                alt="Error"
                width={120}
                height={120}
                mb={6}
              />

              <Text fontSize="14px" color="rgb(150, 150, 150)" mb={6} maxW="400px">
                {errorInfo.message}
                {errorInfo.code && (
                  <Text as="span" fontSize="14px" ml={1}>
                    {errorInfo.code}
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
    </Box>
  );
}

export async function getServerSideProps(context: any) {
  return {
    props: { ...(await serviceSideProps(context)) }
  };
}

export default Error;
