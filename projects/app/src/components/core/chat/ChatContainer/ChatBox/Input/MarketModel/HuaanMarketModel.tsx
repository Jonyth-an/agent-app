import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Grid,
  GridItem,
  VStack,
  HStack,
  Image,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useChatStore } from '@/web/core/chat/context/useChatStore';

// 定义数据类型
interface MarketModuleItem {
  name: string;
  icon: string;
  url: string;
}

interface MarketModuleData {
  title: string;
  titleColor: string;
  titleFontSize: string;
  titleFontWeight: number;
  nameColor?: string;
  nameFontSize?: string;
  nameFontWeight?: number;
  data: MarketModuleItem[];
}

export interface MarketDialogConfig {
  overlayBgColor?: string;
  showHandleBtn?: boolean;
  handleBtnImage?: string;
  moduleBgColor: string;
  moduleTitle: string;
  titleColor: string;
  titleFontSize: string;
  titleFontWeight: number;
  moduleData: MarketModuleData[];
}

interface HuaanMarketModelProps {
  // 移除 isOpen 和 onClose props，因为现在组件内部管理状态
}

const HuaanMarketModel: React.FC<HuaanMarketModelProps> = () => {
  // 使用内部的 useDisclosure 管理弹窗状态
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { agentConfigInfo } = useChatStore();
  const config: MarketDialogConfig = agentConfigInfo?.agentConfig?.marketDialogConfig || {
    moduleData: []
  };

  // 处理模块点击事件
  const handleModuleClick = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <Box
        as="div"
        onClick={onOpen}
        bg="blue.500"
        color="white"
        borderRadius="md"
        _hover={{ bg: 'blue.600' }}
      >
        打
      </Box>

      {/* 弹窗内容 */}
      <Modal
        motionPreset="slideInBottom"
        isOpen={isOpen}
        onClose={onClose}
        isCentered={false}
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg={config.overlayBgColor || 'rgba(0,0,0,0.5)'} />
        <ModalContent
          bg={config.moduleBgColor || '#F4F5F8'}
          borderRadius="18px 18px 0px 0px"
          maxW="100vw"
          w="100%"
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          top="auto"
          margin={0}
          maxH="80vh"
          boxShadow="0px -4px 20px rgba(0, 0, 0, 0.1)"
        >
          {/* 标题栏 */}
          <ModalHeader borderTopRadius="18px" pb={2} pt={4} px={4} position="relative">
            <HStack justify="center" align="center">
              <Text
                color={config.titleColor || '#1A1A1A'}
                fontSize={config.titleFontSize || '18px'}
                fontWeight={config.titleFontWeight || 500}
                textAlign="center"
              >
                {config.moduleTitle}
              </Text>
            </HStack>

            {/* 关闭按钮 */}
            <IconButton
              aria-label="关闭"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              position="absolute"
              top={3}
              right={3}
              onClick={onClose}
              color="gray.500"
              _hover={{ bg: 'gray.100' }}
              fontSize="12px"
            />
          </ModalHeader>

          {/* 内容区域 */}
          <ModalBody px={'16px'} pb={'60px'} pt={0} overflowY="auto">
            <VStack spacing={'28px'} align="stretch">
              {config?.moduleData.map((section, sectionIndex) => (
                <Box key={sectionIndex}>
                  {/* 分类标题 */}
                  <Text
                    color={section.titleColor || '#737373'}
                    fontSize={section.titleFontSize || '16px'}
                    fontWeight={section.titleFontWeight || 400}
                    mb={'15px'}
                  >
                    {section.title}
                  </Text>

                  {/* 功能模块网格 */}
                  <Grid templateColumns="repeat(4, 1fr)" gap={'12px'} justifyItems="center">
                    {section.data.map((item, itemIndex) => (
                      <GridItem key={itemIndex}>
                        <VStack
                          px={'8px'}
                          pt={'14px'}
                          pb={'8px'}
                          borderRadius="12px"
                          bg="white"
                          spacing={1}
                          cursor="pointer"
                          onClick={() => handleModuleClick(item.url)}
                          transition="transform 0.2s ease"
                          align="center"
                          w="76px"
                          h="76px"
                        >
                          {/* 图标 */}
                          <Box
                            w="32px"
                            h="32px"
                            overflow="hidden"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Image
                              src={item.icon}
                              alt={item.name}
                              w="32px"
                              h="32px"
                              objectFit="contain"
                              fallback={<Box w="32px" h="32px" bg="gray.200" borderRadius="6px" />}
                            />
                          </Box>

                          {/* 名称 */}
                          <Text
                            color={section.nameColor || '#1A1A1A'}
                            fontSize={section.nameFontSize || '12px'}
                            fontWeight={section.nameFontWeight || 400}
                            textAlign="center"
                            lineHeight="17px"
                            maxW="60px"
                            noOfLines={1}
                            whiteSpace={'nowrap'}
                          >
                            {item.name}
                          </Text>
                        </VStack>
                      </GridItem>
                    ))}
                  </Grid>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HuaanMarketModel;
