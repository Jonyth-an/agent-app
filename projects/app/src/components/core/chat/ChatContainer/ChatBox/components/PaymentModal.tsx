import type React from 'react';
import { useState } from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';
import { getPrePay, getPayResult } from '@/web/core/chat/user'; // Import your API functions
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { ChatStatusType, LinkTypeEnum } from '@/web/core/app/constants';
import {
  getShareToken,
  redirectAuth,
  tokenIsValid,
  toMemberLanding
} from '@/web/core/chat/context/utils';
import { useRouter } from 'next/router';

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
    setStaffInfo,
    setChatStauts,
    setShareToken,
    setWechatInfoIds,
    openid,
    unionid,
    agentConfigInfo
  } = useChatStore();
  const tenantId = agentConfigInfo.tenantId;
  const agentId = agentConfigInfo.agentId;
  const memberPrice = agentConfigInfo.memberPrice;
  const agentPrice = agentConfigInfo.agentPrice;
  const router = useRouter();
  const userGuideConfig = agentConfigInfo.userGuideConfig;
  const { toast } = useToast();
  const config: PaymentModalConfig = JSON.parse(userGuideConfig);
  // const config: PaymentModalConfig = defaultConfig;

  // const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, config }) => {
  const [loadingButtonIndex, setLoadingButtonIndex] = useState<number>(-1);

  const [outTradeNo, setOutTradeNo] = useState<string>('');
  const onGetPayResult = async (outTradeNo: string) => {
    try {
      const shareToken = getShareToken(agentConfigInfo);
      const res = await getPayResult({ outTradeNo }, shareToken);
      console.log('ccc onGetPayResult res', res);
      toast({
        title: '支付成功',
        status: 'success'
      });
      setChatStauts(ChatStatusType.CAN_CHAT);
    } catch (error) {
      console.log('ccc onGetPayResult 支付失败 res', error);
      toast({
        title: '支付失败',
        status: 'error'
      });
    }
  };
  const onBridgeReady = (params: any, outTradeNo: string) => {
    console.log('ccc onBridgeReady params', params);
    WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res: any) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        onGetPayResult(outTradeNo);
      } else {
        console.log('ccc onBridgeReady 支付失败 res', res);
        toast({
          title: '支付失败',
          status: 'error'
        });
      }
    });
  };

  const pay = (params: any, outTradeNo: string) => {
    if (typeof WeixinJSBridge == 'undefined') {
      if (document.addEventListener) {
        // @ts-ignore
        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
        // @ts-ignore
      } else if (document.attachEvent) {
        // @ts-ignore
        document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
        // @ts-ignore
        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
      }
    } else {
      onBridgeReady(params, outTradeNo);
    }
  };
  const onGetPrePay = async (
    buttonConfig: PaymentButtonConfig,
    index: number,
    shareToken: string
  ) => {
    console.log('ccc onGetPrePay shareToken', shareToken);
    try {
      setLoadingButtonIndex(index);
      const res = await getPrePay(
        {
          agentId,
          openid,
          payScene: 'BUY_AGENT',
          tenantId
        },
        shareToken
      );
      console.log('onGetPrePay res', res);
      const { prepayId, appId, timestamp, nonceStr, paySign, id, tradeStatus } = res;
      if (tradeStatus === 'NOTPAY') {
        const params = {
          appId,
          timeStamp: timestamp,
          nonceStr,
          package: `prepay_id=${prepayId}`,
          signType: 'RSA',
          paySign
        };
        setOutTradeNo(id);
        pay(params, id);
      }
      if (tradeStatus === 'SUCCESS') {
        toast({
          title: '已经支付成功过了',
          status: 'success'
        });
      }
    } catch (error) {
      toast({
        title: '操作失败,请稍后再试',
        status: 'error'
      });
    } finally {
      setLoadingButtonIndex(-1);
    }
  };

  const isLogin = async () => {
    const validRes = await tokenIsValid(
      {
        agentConfigInfo,
        tenantId,
        appId
      },
      router
    );
    console.log('ccc onStartChat tokenIsValid validRes ', validRes);
    const { shareToken, staffInfo } = validRes;
    setShareToken(shareToken);
    setStaffInfo(staffInfo);
    return validRes;
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
          const { shareToken } = await isLogin();
          await onGetPrePay(buttonConfig, index, shareToken);
          break;
        case LinkTypeEnum.LINK_MEMBER:
          await isLogin();
          toMemberLanding({ appId, tenantId, value: buttonConfig.target });
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
        title: '操作失败, 请稍后再试',
        status: 'error'
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
