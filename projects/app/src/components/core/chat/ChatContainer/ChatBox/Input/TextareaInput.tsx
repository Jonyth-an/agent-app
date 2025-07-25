import { Box, Flex, Textarea } from '@chakra-ui/react';
import React, { useRef } from 'react';
import { useTranslation } from 'next-i18next';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { AddIcon } from '@chakra-ui/icons';
import { ChatStatusType } from '@/web/core/app/constants';
import { textareaMinH } from '../constants';

interface TextareaInputProps {
  TextareaDom: React.MutableRefObject<HTMLTextAreaElement | null>;
  fileList: any[];
  showSelectFile: boolean;
  showSelectImg: boolean;
  isSpeaking: boolean;
  selectFileLabel: string;
  selectFileIcon: string;
  onOpenSelectFile: () => void;
  onSelectFile: (params: { files: File[] }) => void;
  inputValue: string;
  setValue: (name: string, value: string) => void;
  handleSend: () => void;
  isPc: boolean;
  t: any;
  whisperConfig?: { open: boolean };
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isTransCription: boolean;
  stopSpeak: (cancel?: boolean) => void;
  onWhisperRecord: () => void;
  speakingTimeString: string;
  chatStauts: string;
  isChatting: boolean;
  havInput: boolean;
  hasFileUploading: boolean;
  onStop: () => void;
  isShowTools: boolean;
  setIsShowTools: (show: boolean) => void;
  fileTypeFilter: (file: File) => boolean;
  File: any; // 添加File组件作为prop
}

const TextareaInput = ({
  TextareaDom,
  fileList,
  showSelectFile,
  showSelectImg,
  isSpeaking,
  selectFileLabel,
  selectFileIcon,
  onOpenSelectFile,
  onSelectFile,
  inputValue,
  setValue,
  handleSend,
  isPc,
  t,
  whisperConfig,
  canvasRef,
  isTransCription,
  stopSpeak,
  onWhisperRecord,
  speakingTimeString,
  chatStauts,
  isChatting,
  havInput,
  hasFileUploading,
  onStop,
  isShowTools,
  setIsShowTools,
  fileTypeFilter,
  File
}: TextareaInputProps) => {
  return (
    <Flex
      className="chat-input-textarea-wrapper"
      alignItems={'flex-end'}
      mt={fileList.length > 0 ? 1 : 0}
      pl={[2, 4]}
    >
      {/* file selector */}
      {(showSelectFile || showSelectImg) && (
        <Flex
          h={'22px'}
          alignItems={'center'}
          justifyContent={'center'}
          cursor={'pointer'}
          transform={'translateY(1px)'}
          onClick={() => {
            if (isSpeaking) return;
            onOpenSelectFile();
          }}
        >
          <MyTooltip label={selectFileLabel}>
            <MyIcon name={selectFileIcon as any} w={'18px'} color={'myGray.600'} />
          </MyTooltip>
          <File onSelect={(files: any) => onSelectFile({ files })} />
        </Flex>
      )}
      {/* input area */}
      <Textarea
        ref={TextareaDom}
        py={0}
        pl={2}
        pr={['30px', '48px']}
        border={'none'}
        _focusVisible={{
          border: 'none'
        }}
        placeholder={
          isSpeaking
            ? t('common:core.chat.Speaking')
            : isPc
            ? t('common:core.chat.Type a message')
            : t('chat:input_placeholder_phone')
        }
        resize={'none'}
        rows={1}
        height={'22px'}
        lineHeight={'22px'}
        maxHeight={'50vh'}
        maxLength={-1}
        overflowY={'auto'}
        whiteSpace={'pre-wrap'}
        wordBreak={'break-all'}
        boxShadow={'none !important'}
        color={'myGray.900'}
        isDisabled={isSpeaking}
        value={inputValue}
        fontSize={['md', 'sm']}
        onChange={(e) => {
          const textarea = e.target;
          textarea.style.height = textareaMinH;
          textarea.style.height = `${textarea.scrollHeight}px`;
          setValue('input', textarea.value);
        }}
        onKeyDown={(e) => {
          // enter send.(pc or iframe && enter and unPress shift)
          const isEnter = e.keyCode === 13;
          if (isEnter && TextareaDom.current && (e.ctrlKey || e.altKey)) {
            // Add a new line
            const index = TextareaDom.current.selectionStart;
            const val = TextareaDom.current.value;
            TextareaDom.current.value = `${val.slice(0, index)}\n${val.slice(index)}`;
            TextareaDom.current.selectionStart = index + 1;
            TextareaDom.current.selectionEnd = index + 1;

            TextareaDom.current.style.height = textareaMinH;
            TextareaDom.current.style.height = `${TextareaDom.current.scrollHeight}px`;

            return;
          }

          // 全选内容
          // @ts-ignore
          e.key === 'a' && e.ctrlKey && e.target?.select();

          if ((isPc || window !== parent) && e.keyCode === 13 && !e.shiftKey) {
            handleSend();
            e.preventDefault();
          }
        }}
        onPaste={(e) => {
          const clipboardData = e.clipboardData;
          if (clipboardData && (showSelectFile || showSelectImg)) {
            const items = clipboardData.items;
            const files = Array.from(items)
              .map((item) => (item.kind === 'file' ? item.getAsFile() : undefined))
              .filter((file) => {
                return file && fileTypeFilter(file);
              }) as File[];
            onSelectFile({ files });

            if (files.length > 0) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }}
      />

      <Flex
        alignItems={'center'}
        position={'absolute'}
        right={[2, isPc ? 4 : 14]}
        bottom={['10px', '12px']}
      >
        {/* voice-input */}
        {whisperConfig?.open && !inputValue && !isChatting && (
          <>
            <canvas
              ref={canvasRef}
              style={{
                height: '30px',
                width: isSpeaking && !isTransCription ? '100px' : 0,
                background: 'white',
                zIndex: 0
              }}
            />
            {isSpeaking && (
              <MyTooltip label={t('common:core.chat.Cancel Speak')}>
                <Flex
                  mr={2}
                  alignItems={'center'}
                  justifyContent={'center'}
                  flexShrink={0}
                  h={['26px', '32px']}
                  w={['26px', '32px']}
                  borderRadius={'md'}
                  cursor={'pointer'}
                  _hover={{ bg: '#F5F5F8' }}
                  onClick={() => stopSpeak(true)}
                >
                  <MyIcon
                    name={'core/chat/cancelSpeak'}
                    width={['20px', '22px']}
                    height={['20px', '22px']}
                  />
                </Flex>
              </MyTooltip>
            )}
            <MyTooltip
              label={isSpeaking ? t('common:core.chat.Finish Speak') : t('common:core.chat.Record')}
            >
              <Flex
                mr={2}
                alignItems={'center'}
                justifyContent={'center'}
                flexShrink={0}
                h={['26px', '32px']}
                w={['26px', '32px']}
                borderRadius={'md'}
                cursor={'pointer'}
                _hover={{ bg: '#F5F5F8' }}
                onClick={onWhisperRecord}
              >
                <MyIcon
                  name={isSpeaking ? 'core/chat/finishSpeak' : 'core/chat/recordFill'}
                  width={['20px', '22px']}
                  height={['20px', '22px']}
                  color={isSpeaking ? 'primary.500' : 'myGray.600'}
                />
              </Flex>
            </MyTooltip>
          </>
        )}
        {/* send and stop icon */}
        {isSpeaking ? (
          <Box color={'#5A646E'} w={'36px'} textAlign={'right'} whiteSpace={'nowrap'}>
            {speakingTimeString}
          </Box>
        ) : // 判断是否可以聊天
        chatStauts === ChatStatusType.CAN_CHAT ? (
          <Flex
            alignItems={'center'}
            justifyContent={'center'}
            flexShrink={0}
            mr={isPc ? 0 : 10}
            h={['28px', '32px']}
            w={['28px', '32px']}
            borderRadius={'md'}
            bg={
              isSpeaking || isChatting
                ? ''
                : !havInput || hasFileUploading
                ? '#E5E5E5'
                : 'primary.500'
            }
            cursor={havInput ? 'pointer' : 'not-allowed'}
            lineHeight={1}
            onClick={() => {
              if (isChatting) {
                return onStop();
              }
              return handleSend();
            }}
          >
            {isChatting ? (
              <MyIcon
                animation={'zoomStopIcon 0.4s infinite alternate'}
                width={['22px', '25px']}
                height={['22px', '25px']}
                cursor={'pointer'}
                name={'stop'}
                color={'gray.500'}
              />
            ) : (
              <MyTooltip label={t('common:core.chat.Send Message')}>
                <MyIcon
                  name={'core/chat/sendFill'}
                  width={['18px', '20px']}
                  height={['18px', '20px']}
                  color={'white'}
                />
              </MyTooltip>
            )}
          </Flex>
        ) : (
          // 不能聊天
          <Flex
            alignItems={'center'}
            justifyContent={'center'}
            flexShrink={0}
            mr={isPc ? 0 : 10}
            h={['28px', '32px']}
            w={['28px', '32px']}
            borderRadius={'md'}
            bg={'#E5E5E5'}
            cursor={havInput ? 'pointer' : 'not-allowed'}
            lineHeight={1}
          >
            <MyIcon
              name={'core/chat/sendFill'}
              width={['18px', '20px']}
              height={['18px', '20px']}
              color={'white'}
            />
          </Flex>
        )}
      </Flex>
      {/* mark */}
      {!isPc ? (
        <Flex
          alignItems={'center'}
          justifyContent={'center'}
          flexShrink={0}
          h={['28px', '32px']}
          w={['28px', '32px']}
          borderRadius={'md'}
          bg={'#E5E5E5'}
          position={'absolute'}
          right={[2, 4]}
          bottom={['10px', '12px']}
          onClick={() => setIsShowTools(!isShowTools)}
        >
          <AddIcon
            name={'history'}
            color={'white'}
            width={['18px', '20px']}
            height={['18px', '20px']}
          />
        </Flex>
      ) : null}
    </Flex>
  );
};

export default TextareaInput;
