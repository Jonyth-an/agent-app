import type React from 'react';
import { useState } from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';
import { getPrePay, getPayResult } from '@/web/core/chat/user'; // Import your API functions
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { LinkTypeEnum } from '@/web/core/app/constants';
import { redirectAuth, toMemberLanding } from '@/web/core/chat/context/utils';

export interface PaymentButtonConfig {
  textBefore: string;
  textAfter: string;
  colorScheme?: string;
  textColor?: string;
  borderColor?: string;
  variant?: 'solid' | 'outline';
  linkType: string;
  target?: string;
  field?: string;
  loading?: {
    text: string;
  };
}

export interface PaymentModalConfig {
  card: {
    bgColor: string;
  };
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

const defaultConfig: PaymentModalConfig = {
  card: {
    bgColor: 'rgba(245, 245, 245, 1)'
  },
  title: {
    text: '免费体验额度已使用完毕',
    color: 'gray.700'
  },
  buttons: [
    {
      textBefore: '去激活',
      textAfter: '',
      colorScheme: 'blue',
      textColor: 'white',
      variant: 'solid',
      linkType: 'LINK_AUTH'
    },
    {
      textBefore: '点击购买完整版￥',
      textAfter: '/年',
      colorScheme: 'blue',
      textColor: 'white',
      variant: 'solid',
      linkType: 'LINK_PAY'
    },
    {
      textBefore: '开通会员￥',
      textAfter: '/年',
      colorScheme: 'gray',
      textColor: 'blue.500',
      borderColor: 'blue.500',
      variant: 'outline',
      linkType: 'LINK_MEMBER',
      target: '1'
    },
    {
      textBefore: '自定义跳转按钮',
      textAfter: '',
      colorScheme: 'green',
      linkType: 'LINK_REDIRECT',
      target:
        'https://aim-saas-share-dev.newtamp.cn/share-agent/chat?appId=67b860750d1c6dfdccebab3d'
    }
  ]
};

const PaymentModal: React.FC<any> = () => {
  const {
    appId,
    shareToken,
    setChatStauts,
    setShareToken,
    setWechatInfoIds,
    openid,
    unionid,
    agentConfigInfo
  } = useChatStore();
  const tenantId = agentConfigInfo.tenantId;
  const memberPrice = agentConfigInfo.memberPrice;
  const agentPrice = agentConfigInfo.agentPrice;
  const userGuideConfig = agentConfigInfo.userGuideConfig;
  const { toast } = useToast();
  const config: PaymentModalConfig = JSON.parse(userGuideConfig);
  // const config: PaymentModalConfig = defaultConfig;

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
      console.log('ccc handleButtonClick buttonConfig', buttonConfig);
      setLoadingButtonIndex(index);

      switch (buttonConfig.linkType) {
        case LinkTypeEnum.LINK_AUTH:
          redirectAuth({ appId, tenantId });
          break;
        case LinkTypeEnum.LINK_PAY:
          // 处理支付逻辑
          // await onGetPrePay(buttonConfig, index);
          break;
        case LinkTypeEnum.LINK_MEMBER:
          toMemberLanding({ appId, tenantId, memberLevel: buttonConfig.target });
          // 处理会员页面跳转
          break;

        case LinkTypeEnum.LINK_REDIRECT:
          window.location.href = buttonConfig.target || '';
          break;
        default:
          toast({
            title: '未知的链接类型',
            status: 'error'
          });
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
    <Box>
      <Box
        bg={config.card.bgColor}
        borderRadius="md"
        p={4}
        width="85%"
        maxWidth="450px"
        mx="auto"
        mb={0}
        mt={20}
        pb={7}
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

          {config.buttons.map((button, index) => {
            const btnText = (button: PaymentButtonConfig) => {
              // const getField = (button:PaymentButtonConfig, field: string) =>{
              //   return button
              // }
              if (button.linkType === LinkTypeEnum.LINK_PAY) {
                return `${button.textBefore}${agentPrice}${button.textAfter}`;
              }
              if (button.linkType === LinkTypeEnum.LINK_MEMBER) {
                return `${button.textBefore}${memberPrice}${button.textAfter}`;
              }
              return `${button.textBefore}${button.textAfter}`;
            };
            return (
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
                {btnText(button)}
              </Button>
            );
          })}
        </VStack>
      </Box>
      <Box height={'30px'}></Box>
    </Box>
  );
};

export default PaymentModal;
