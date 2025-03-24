import type React from 'react';
import { useState } from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';
import { getPrePay, getPayResult } from '@/web/core/chat/user'; // Import your API functions
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useToast } from '@fastgpt/web/hooks/useToast';
export enum LinkTypeEnum {
  AUTH_REDIRECT = 'auth_redirect',
  PAYMENT = 'payment',
  MEMBER_PAGE = 'member_page',
  CUSTOM = 'custom'
}

export interface PaymentButtonConfig {
  text: string;
  colorScheme?: string;
  textColor?: string;
  borderColor?: string;
  variant?: 'solid' | 'outline';
  linkType: LinkTypeEnum;
  target?: string;
  loading?: {
    text: string;
  };
}

export interface PaymentModalConfig {
  title: {
    text: string;
    color?: string;
  };
  buttons: PaymentButtonConfig[];
}

interface PaymentModalProps {
  onClose?: () => void;
  config: PaymentModalConfig;
}

const config: PaymentModalConfig = {
  title: {
    text: '免费体验额度已使用完毕',
    color: 'gray.700'
  },
  buttons: [
    {
      text: '点击购买完整版￥200/年',
      colorScheme: 'blue',
      textColor: 'white',
      variant: 'solid',
      linkType: LinkTypeEnum.PAYMENT
    },
    {
      text: '开通会员￥399/年',
      colorScheme: 'gray',
      textColor: 'blue.500',
      borderColor: 'blue.500',
      variant: 'outline',
      linkType: LinkTypeEnum.MEMBER_PAGE,
      target: 'vip-1',
      loading: {
        text: '处理中...'
      }
    },
    {
      text: '自定义跳转按钮',
      colorScheme: 'green',
      linkType: LinkTypeEnum.CUSTOM,
      target: 'https://example.com'
    }
  ]
};

const PaymentModal: React.FC<any> = () => {
  const {
    shareToken,
    setChatStauts,
    setShareToken,
    setWechatInfoIds,
    openid,
    unionid,
    agentConfigInfo
  } = useChatStore();
  const tenantId = agentConfigInfo.tenantId;
  const { toast } = useToast();

  // const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, config }) => {
  const [loadingButtonIndex, setLoadingButtonIndex] = useState<number>(-1);

  const [outTradeNo, setOutTradeNo] = useState<string | null>(null);

  const onGetPrePay = async (buttonConfig: PaymentButtonConfig, index: number) => {
    try {
      setLoadingButtonIndex(index);
      const res = await getPrePay(
        {
          openid,
          payScene: 'BUY_AGENT',
          tenantId
        },
        shareToken
      );

      // if (res.code === 0) {
      //   const { prepayId, appId, timestamp, nonceStr, paySign, id } = res.data;
      //   const params = {
      //     appId,
      //     timeStamp: timestamp,
      //     nonceStr,
      //     package: `prepay_id=${prepayId}`,
      //     signType: "RSA",
      //     paySign
      //   };
      //   setOutTradeNo(id);
      //   pay(params);
      // } else {
      //   toast({
      //     title: res.msg,
      //     status: 'error',
      //     duration: 3000,
      //     isClosable: true
      //   });
      // }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '请稍后再试',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setLoadingButtonIndex(-1);
    }
  };

  const onGetPayResult = async (outTradeNo: string) => {
    // try {
    //   const res = await getPayResult(outTradeNo);
    //   console.log('fff getPayResult res', res);
    //   // if (res.code) {
    //   //   toast({
    //   //     title: res.msg,
    //   //     status: 'error',
    //   //     duration: 3000,
    //   //     isClosable: true
    //   //   });
    //   // } else {
    //   //   handleToPath();
    //   // }
    // } catch (error) {
    //   console.error('Error in getPayResult:', error);
    // }
  };

  const onBridgeReady = (params: any) => {
    WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res: any) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        // onGetPayResult();
      } else {
        console.log('支付失败', res);
      }
    });
  };

  const pay = (params: any) => {
    if (typeof WeixinJSBridge === 'undefined') {
      if (document.addEventListener) {
        document.addEventListener('WeixinJSBridgeReady', () => onBridgeReady(params), false);
        document.addEventListener('onWeixinJSBridgeReady', () => onBridgeReady(params), false);
      } else {
        onBridgeReady(params);
      }
    }
  };

  const handleButtonClick = async (buttonConfig: PaymentButtonConfig, index: number) => {
    try {
      setLoadingButtonIndex(index);

      switch (buttonConfig.linkType) {
        case LinkTypeEnum.PAYMENT:
          // 处理支付逻辑
          await onGetPrePay(buttonConfig, index);
          break;
        case LinkTypeEnum.MEMBER_PAGE:
          // 处理会员页面跳转
          break;
        case LinkTypeEnum.AUTH_REDIRECT:
        case LinkTypeEnum.CUSTOM:
          window.location.href = buttonConfig.target || '';
          break;
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '请稍后再试',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoadingButtonIndex(-1);
    }
  };

  return (
    <Box
      bg="gray.100"
      borderRadius="md"
      p={4}
      width="80%"
      maxWidth="400px"
      mx="auto"
      mb={55}
      mt={14}
      boxShadow="sm"
    >
      <VStack spacing={4} align="stretch">
        <Text
          fontSize="md"
          fontWeight="medium"
          textAlign="center"
          color={config.title.color || 'gray.700'}
        >
          {config.title.text}
        </Text>

        {config.buttons.map((button, index) => (
          <Button
            key={index}
            colorScheme={button.colorScheme || 'blue'}
            variant={button.variant || 'solid'}
            size="md"
            width="100%"
            onClick={() => handleButtonClick(button, index)}
            isLoading={loadingButtonIndex === index}
            loadingText={button.loading?.text || '处理中...'}
            color={button.textColor}
            borderColor={button.borderColor}
          >
            {button.text}
          </Button>
        ))}
      </VStack>
    </Box>
  );
};

export default PaymentModal;
