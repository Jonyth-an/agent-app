import { Flex, Text, Input } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { AddIcon, HamburgerIcon } from '@chakra-ui/icons';
import type React from 'react';
import { useRef } from 'react';
import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { RunPlatformEnum } from '@fastgpt/global/core/chat/constants';

interface OpenToolsProps {
  isOpen: boolean;
  onToggle: () => void;
  onImageSelect: (files: FileList) => void;
}

const OpenTools: React.FC<OpenToolsProps> = ({ isOpen, onToggle, onImageSelect }) => {
  const onOpenSlider = useContextSelector(ChatContext, (v) => v.onOpenSlider);
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { agentConfigInfo, runPlatform } = useChatStore();
  const friend_share_config = agentConfigInfo.agentConfig.miniprogram.friend_share_config || {};
  console.log('ccc friend_share_config', friend_share_config);
  const switchFlag = (friend_share_config && friend_share_config.switch) || false;
  const friendMiniPath = (friend_share_config && friend_share_config.miniPath) || '';
  const config = (friend_share_config && friend_share_config.config) || {};
  const params = config.params || {};
  const type = config.type || {};
  const pageName = config.pageName || '';
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageSelect(files);
    }
    e.target.value = '';
  };

  const ToolItem = ({
    icon,
    label,
    onClick
  }: {
    icon: string | React.ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <Flex
      direction="column"
      align="center"
      justify="center"
      w="65px"
      h="65px"
      bg="gray.100"
      borderRadius="md"
      cursor="pointer"
      onClick={onClick}
    >
      {icon}
      <Text fontSize="12px" color="gray.600" textAlign="center">
        {label}
      </Text>
    </Flex>
  );
  const onFnWrapper = (cb: Function) => {
    cb();
    onToggle();
  };

  const onShareFriend = () => {
    const url = `${friendMiniPath}?type=${type}&params=${encodeURIComponent(
      JSON.stringify(params)
    )}&pageName=${pageName}`;
    console.log('ccc onShareFriend url', url);
    wx.miniProgram.navigateTo({ url });
  };
  return (
    <Flex
      justify="flex-start"
      align="center"
      w="100%"
      py={3}
      px={3}
      gap={3}
      borderTop="1px solid"
      borderColor="rgba(0,0,0,0.07)"
      bg="white"
    >
      <ToolItem
        icon={<HamburgerIcon w="26px" h="26px" color="gray.600" mb={1.5} />}
        label="历史对话"
        onClick={() => onFnWrapper(onOpenSlider)}
      />
      <ToolItem
        icon={<AddIcon w="26px" h="26px" color="gray.600" mb={1.5} />}
        label="新对话"
        onClick={() => onFnWrapper(onChangeChatId)}
      />

      {switchFlag && runPlatform === RunPlatformEnum.MINI_PROGRAM ? (
        <ToolItem
          icon={<MyIcon name={'common/shareFriend'} w="26px" h="26px" mb={1.5} />}
          label="分享朋友圈"
          onClick={() => onFnWrapper(onShareFriend)}
        />
      ) : null}

      {/* <ToolItem icon="image" label="相册" onClick={() => albumInputRef.current?.click()} />
      <ToolItem icon="camera" label="拍照" onClick={() => cameraInputRef.current?.click()} />

      <Input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        multiple
        display="none"
        onChange={handleFileSelect}
      />
      <Input
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
