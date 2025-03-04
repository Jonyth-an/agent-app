import { Box, Flex, IconButton, Input } from '@chakra-ui/react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { AddIcon } from '@chakra-ui/icons';
import type React from 'react';
import { useRef } from 'react';
import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';

interface OpenToolsProps {
  isOpen: boolean;
  onToggle: () => void;
  onImageSelect: (files: FileList) => void;
}

const OpenTools: React.FC<OpenToolsProps> = ({ isOpen, onToggle, onImageSelect }) => {
  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const onOpenSlider = useContextSelector(ChatContext, (v) => v.onOpenSlider);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageSelect(files);
    }
    e.target.value = '';
  };

  return (
    <Flex
      justify="start"
      align="center"
      w="100%"
      py={4}
      px={4}
      gap={4}
      borderTop="1px solid"
      borderColor="gray.200"
      bg="white"
    >
      {/* 历史对话 */}
      <Flex
        alignItems={'center'}
        justifyContent={'center'}
        flexShrink={0}
        h={['28px', '32px']}
        w={['28px', '32px']}
        borderRadius={'md'}
        bg={'#E5E5E5'}
        cursor="pointer"
        _hover={{ bg: 'gray.200' }}
        onClick={onOpenSlider}
      >
        <MyIcon name={'menu'} w={'20px'} h={'20px'} color={'myGray.900'} />
      </Flex>

      {/* 新对话 */}
      <Flex
        alignItems={'center'}
        justifyContent={'center'}
        flexShrink={0}
        h={['28px', '32px']}
        w={['28px', '32px']}
        borderRadius={'md'}
        bg={'#E5E5E5'}
        cursor="pointer"
        _hover={{ bg: 'gray.200' }}
        onClick={onToggle}
      >
        <AddIcon w={'20px'} h={'20px'} color={'myGray.900'} />
      </Flex>

      {/* 相册 */}
      {/* <Flex
        alignItems={'center'}
        justifyContent={'center'}
        flexShrink={0}
        h={['28px', '32px']}
        w={['28px', '32px']}
        borderRadius={'md'}
        bg={'#E5E5E5'}
        cursor="pointer"
        _hover={{ bg: 'gray.200' }}
        onClick={() => albumInputRef.current?.click()}
      >
        <MyIcon name={'image'} w={'20px'} h={'20px'} color={'myGray.900'} />
      </Flex> */}
      {/* <Input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        multiple
        display="none"
        onChange={handleFileSelect}
      /> */}

      {/* 拍照 */}
      {/* <Flex
        alignItems={'center'}
        justifyContent={'center'}
        flexShrink={0}
        h={['28px', '32px']}
        w={['28px', '32px']}
        borderRadius={'md'}
        bg={'#E5E5E5'}
        cursor="pointer"
        _hover={{ bg: 'gray.200' }}
        onClick={() => cameraInputRef.current?.click()}
      >
        <MyIcon name={'camera'} w={'20px'} h={'20px'} color={'myGray.900'} />
      </Flex> */}
      {/* <Input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        display="none"
        onChange={handleFileSelect}
      /> */}
    </Flex>
  );
};

export default OpenTools;
