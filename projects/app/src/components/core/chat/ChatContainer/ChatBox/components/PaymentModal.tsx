import type React from 'react';
import { useState } from 'react';
import { Box, Text, Button, VStack, useToast, Flex } from '@chakra-ui/react';

interface PaymentModalProps {
  onClose?: () => void;
}

// Declare WeixinJSBridge
declare const WeixinJSBridge: any;

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // 处理微信支付
  const handleWechatPay = async () => {
    try {
      setIsLoading(true);

      // 获取预支付信息
      const response = await fetch('/api/prepay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payScene: 'PAID_ACTIVATION'
          // 其他必要参数
        })
      });

      const result = await response.json();

      if (result.code === 0) {
        const { prepayId, appId, timestamp, nonceStr, paySign, id } = result.data;
        const params = {
          appId,
          timeStamp: timestamp,
          nonceStr,
          package: `prepay_id=${prepayId}`,
          signType: 'RSA',
          paySign
        };

        pay(params, id);
      } else {
        toast({
          title: '获取支付信息失败',
          description: result.msg,
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('支付请求失败:', error);
      toast({
        title: '支付请求失败',
        description: '请稍后再试',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 调用微信支付
  const pay = (params: any, outTradeNo: string) => {
    // if (typeof WeixinJSBridge === 'undefined') {
    //   if (document.addEventListener) {
    //     document.addEventListener(
    //       'WeixinJSBridgeReady',
    //       () => onBridgeReady(params, outTradeNo),
    //       false
    //     );
    //   } else if (document.attachEvent) {
    //     document.attachEvent('WeixinJSBridgeReady', () => onBridgeReady(params, outTradeNo));
    //     document.attachEvent('onWeixinJSBridgeReady', () => onBridgeReady(params, outTradeNo));
    //   }
    // } else {
    //   onBridgeReady(params, outTradeNo);
    // }
  };

  // 微信支付桥接
  const onBridgeReady = (params: any, outTradeNo: string) => {
    WeixinJSBridge.invoke('getBrandWCPayRequest', params, async (res: any) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        // 支付成功，查询支付结果
        try {
          const response = await fetch('/api/payResult', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ outTradeNo })
          });

          const result = await response.json();

          if (result.code === 0) {
            toast({
              title: '支付成功',
              description: '您已成功购买完整版',
              status: 'success',
              duration: 3000,
              isClosable: true
            });

            if (onClose) onClose();
            // 可以在这里添加支付成功后的逻辑，如刷新页面或更新用户状态
          } else {
            toast({
              title: '支付结果查询失败',
              description: result.msg,
              status: 'warning',
              duration: 3000,
              isClosable: true
            });
          }
        } catch (error) {
          console.error('查询支付结果失败:', error);
        }
      } else {
        console.log('支付失败或取消', res);
        toast({
          title: '支付未完成',
          description: '您可以稍后再试',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
      }
    });
  };

  // 处理会员链接跳转
  const handleMembershipRedirect = () => {
    window.location.href = 'https://example.com/membership'; // 替换为实际的会员链接
  };

  return (
    <Box
      bg="gray.100"
      borderRadius="md"
      p={4}
      width="80%"
      maxWidth="400px"
      mx="auto"
      mb={4}
      mt={4}
      boxShadow="sm"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="md" fontWeight="medium" textAlign="center" color="gray.700">
          免费体验额度已使用完毕
        </Text>

        <Button
          colorScheme="blue"
          size="md"
          width="100%"
          onClick={handleWechatPay}
          isLoading={isLoading}
          loadingText="处理中..."
        >
          点击购买完整版￥200/年
        </Button>

        <Flex
          as={Button}
          variant="outline"
          colorScheme="blue"
          size="md"
          width="100%"
          onClick={handleMembershipRedirect}
          justifyContent="center"
        >
          <Text>开通会员￥399/年</Text>
          <Text ml={1} color="blue.500">
            立享所有智能体
          </Text>
        </Flex>
      </VStack>
    </Box>
  );
};

export default PaymentModal;
