import { useSpeech } from '@/web/common/hooks/useSpeech';
import { AddIcon } from '@chakra-ui/icons';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { Box, Flex, Spinner, Textarea } from '@chakra-ui/react';
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import {
  ChatBoxInputFormType,
  ChatBoxInputType,
  ChatInputRefType,
  SendPromptFnType
} from '../type';
import { textareaMinH } from '../constants';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { ChatBoxContext } from '../Provider';
import dynamic from 'next/dynamic';
import { useContextSelector } from 'use-context-selector';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { documentFileType } from '@fastgpt/global/common/file/constants';
import FilePreview from '../../components/FilePreview';
import { useFileUpload } from '../hooks/useFileUpload';
import ComplianceTip from '@/components/common/ComplianceTip/index';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import CardList, { CardItem } from './card-list';
import ChatTools from './chat-tools';
import OpenTools from './open-tools';
import { ChatStatusType } from '@/web/core/app/constants';
import ComponentWrapper from '../CompoentWrapper';
import EntryList from './EntryList/EntryList';
import HuaanEntryList from './EntryList/HuaanEntryList';
import { StyleTypeEnum, useCurrentStyleType } from '@/components/Markdown/styles/styleUtils';
const InputGuideBox = dynamic(() => import('./InputGuideBox'));

const fileTypeFilter = (file: File) => {
  return (
    file.type.includes('image') ||
    documentFileType.split(',').some((type) => file.name.endsWith(type.trim()))
  );
};

// 修改组件定义为 forwardRef
// 添加 Props 接口定义
interface ChatInputProps {
  onSendMessage: SendPromptFnType;
  onStop: () => void;
  TextareaDom: React.MutableRefObject<HTMLTextAreaElement | null>;
  resetInputVal: (val: ChatBoxInputType) => void;
  chatForm: UseFormReturn<ChatBoxInputFormType>;
}

// 修改组件定义，添加类型
// 添加 ref 类型
const ChatInput = React.forwardRef<ChatInputRefType, ChatInputProps>(
  ({ onSendMessage, onStop, TextareaDom, resetInputVal, chatForm }, ref) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { isPc } = useSystem();

    const { setValue, watch, control } = chatForm;
    const inputValue = watch('input');

    const outLinkAuthData = useContextSelector(ChatBoxContext, (v) => v.outLinkAuthData);
    const appId = useContextSelector(ChatBoxContext, (v) => v.appId);
    const chatId = useContextSelector(ChatBoxContext, (v) => v.chatId);
    const isChatting = useContextSelector(ChatBoxContext, (v) => v.isChatting);
    const whisperConfig = useContextSelector(ChatBoxContext, (v) => v.whisperConfig);
    const autoTTSResponse = useContextSelector(ChatBoxContext, (v) => v.autoTTSResponse);
    const chatInputGuide = useContextSelector(ChatBoxContext, (v) => v.chatInputGuide);
    const fileSelectConfig = useContextSelector(ChatBoxContext, (v) => v.fileSelectConfig);
    const { agentConfigInfo, chatStauts } = useChatStore();
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isShowTools, setIsShowTools] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const styleType = useCurrentStyleType();
    const listStyle = agentConfigInfo?.agentConfig?.listStyle || {};

    React.useImperativeHandle(ref, () => ({
      closeTools: () => {
        setIsShowTools(false);
      }
    }));
    const fileCtrl = useFieldArray({
      control,
      name: 'files'
    });
    const {
      File,
      onOpenSelectFile,
      fileList,
      onSelectFile,
      uploadFiles,
      selectFileIcon,
      selectFileLabel,
      showSelectFile,
      showSelectImg,
      removeFiles,
      replaceFiles,
      hasFileUploading
    } = useFileUpload({
      fileSelectConfig,
      fileCtrl,
      outLinkAuthData,
      appId,
      chatId
    });
    const havInput = !!inputValue || fileList.length > 0;
    const canSendMessage = havInput && !hasFileUploading;

    // Upload files
    useRequest2(uploadFiles, {
      manual: false,
      errorToast: t('common:upload_file_error'),
      refreshDeps: [fileList, outLinkAuthData, chatId]
    });

    /* on send */
    const handleSend = useCallback(
      async (val?: string) => {
        if (!canSendMessage) return;
        const textareaValue = val || TextareaDom.current?.value || '';

        onSendMessage({
          text: textareaValue.trim(),
          files: fileList
        });
        replaceFiles([]);
      },
      [TextareaDom, canSendMessage, fileList, onSendMessage, replaceFiles]
    );

    /* whisper init */
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
      isSpeaking,
      isTransCription,
      stopSpeak,
      startSpeak,
      speakingTimeString,
      renderAudioGraph,
      stream
    } = useSpeech({ appId, ...outLinkAuthData });

    let boxShadowStyle = '0 0 10px rgba(54,111,255,0.4)';
    if (styleType === StyleTypeEnum.huaan) {
      boxShadowStyle = listStyle?.containerShadow || '';
    } else {
      boxShadowStyle = isSpeaking ? `0 0 10px rgba(54,111,255,0.4)` : `0 0 10px rgba(0,0,0,0.2)`;
    }

    const onWhisperRecord = useCallback(() => {
      const finishWhisperTranscription = (text: string) => {
        if (!text) return;
        if (whisperConfig?.autoSend) {
          onSendMessage({
            text,
            files: fileList,
            autoTTSResponse
          });
          replaceFiles([]);
        } else {
          resetInputVal({ text });
        }
      };
      if (isSpeaking) {
        return stopSpeak();
      }
      startSpeak(finishWhisperTranscription);
    }, [
      autoTTSResponse,
      fileList,
      isSpeaking,
      onSendMessage,
      replaceFiles,
      resetInputVal,
      startSpeak,
      stopSpeak,
      whisperConfig?.autoSend
    ]);
    useEffect(() => {
      if (!stream) {
        return;
      }
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 1;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const renderCurve = () => {
        if (!canvasRef.current) return;
        renderAudioGraph(analyser, canvasRef.current);
        window.requestAnimationFrame(renderCurve);
      };
      renderCurve();
    }, [renderAudioGraph, stream]);

    const RenderTranslateLoading = useMemo(
      () => (
        <Flex
          position={'absolute'}
          top={0}
          bottom={0}
          left={0}
          right={0}
          zIndex={10}
          pl={5}
          alignItems={'center'}
          bg={'white'}
          color={'primary.500'}
          visibility={isSpeaking && isTransCription ? 'visible' : 'hidden'}
        >
          <Spinner size={'sm'} mr={4} />
          {t('common:core.chat.Converting to text')}
        </Flex>
      ),
      [isSpeaking, isTransCription, t]
    );

    const RenderTextarea = useMemo(
      () => (
        <Flex alignItems={'flex-end'} mt={fileList.length > 0 ? 1 : 0} pl={[2, 4]}>
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
              <File onSelect={(files) => onSelectFile({ files })} />
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
                  label={
                    isSpeaking ? t('common:core.chat.Finish Speak') : t('common:core.chat.Record')
                  }
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
                // bg={'green'}
                bg={'#E5E5E5'}
                cursor={havInput ? 'pointer' : 'not-allowed'}
                lineHeight={1}
                // onClick={() => {
                //   if (isChatting) {
                //     return onStop();
                //   }
                //   return handleSend();
                // }}
              >
                <MyIcon
                  name={'core/chat/sendFill'}
                  width={['18px', '20px']}
                  height={['18px', '20px']}
                  color={'white'}
                  // color={'red'}
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
              // onClick={() => setIsToolsOpen(!isToolsOpen)}
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
      ),
      [
        chatStauts,
        File,
        TextareaDom,
        fileList,
        handleSend,
        hasFileUploading,
        havInput,
        inputValue,
        isChatting,
        isPc,
        isSpeaking,
        isTransCription,
        onOpenSelectFile,
        onSelectFile,
        onStop,
        onWhisperRecord,
        selectFileIcon,
        selectFileLabel,
        setValue,
        showSelectFile,
        showSelectImg,
        speakingTimeString,
        stopSpeak,
        t,
        whisperConfig?.open,
        isShowTools
      ]
    );

    const entryItems: CardItem[] = useMemo(() => {
      const agentConfig = agentConfigInfo?.agentConfig || {};
      const entryItems = (agentConfig && agentConfig.list) || [];
      return entryItems;
    }, [agentConfigInfo]);

    const handleImageSelect = (files: FileList) => {
      // 将文件转换为预览URL
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setSelectedImages((prev: any) => [...prev, ...newImages]);
    };

    const handleImageDelete = (index: number) => {
      setSelectedImages((prev: any) => {
        const newImages = [...prev];
        // 释放被删除图片的 URL
        URL.revokeObjectURL(newImages[index]);
        newImages.splice(index, 1);
        return newImages;
      });
    };

    // 组件卸载时清理创建的 URL
    useEffect(() => {
      return () => {
        selectedImages.forEach((url: any) => URL.revokeObjectURL(url));
      };
    }, [selectedImages]);

    return (
      <Box
        m={['0 auto', '10px auto']}
        w={'100%'}
        maxW={['auto', 'min(800px, 100%)']}
        px={[0, 5]}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          if (!(showSelectFile || showSelectImg)) return;
          const files = Array.from(e.dataTransfer.files);

          const droppedFiles = files.filter((file) => fileTypeFilter(file));
          if (droppedFiles.length > 0) {
            onSelectFile({ files: droppedFiles });
          }

          const invalidFileName = files
            .filter((file) => !fileTypeFilter(file))
            .map((file) => file.name)
            .join(', ');
          if (invalidFileName) {
            toast({
              status: 'warning',
              title: t('chat:unsupported_file_type'),
              description: invalidFileName
            });
          }
        }}
      >
        {/* mark卡片列表 */}
        <Box className="input-bom-wrapper" boxShadow={boxShadowStyle}>
          {/* {cardItems.length > 0 ? <CardList cardItems={cardItems} /> : null} */}
          {entryItems.length > 0 ? (
            <ComponentWrapper
              defaultComponent={EntryList}
              huaanComponent={HuaanEntryList}
              entryItems={entryItems}
            />
          ) : null}

          <Box
            pt={fileList.length > 0 ? '0' : ['14px', '18px']}
            pb={['14px', '18px']}
            position={'relative'}
            borderRadius={['none', 'md']}
            bg={'white'}
            overflow={'display'}
            {...(isPc
              ? {
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.07)'
                }
              : {
                  borderTop: '1px solid',
                  borderTopColor: 'rgba(0,0,0,0.07)'
                })}
          >
            {/* Chat input guide box */}
            {chatInputGuide.open && (
              <InputGuideBox
                appId={appId}
                text={inputValue}
                onSelect={(e) => {
                  setValue('input', e);
                }}
                onSend={(e) => {
                  handleSend(e);
                }}
              />
            )}

            {/* translate loading */}
            {RenderTranslateLoading}

            {/* file preview */}
            <Box px={[1, 3]}>
              <FilePreview fileList={fileList} removeFiles={removeFiles} />
            </Box>
            {RenderTextarea}
          </Box>
          {/* <open-tools/> mark */}
          {isShowTools ? (
            <OpenTools
              isOpen={isToolsOpen}
              onToggle={() => setIsShowTools(!isShowTools)}
              onImageSelect={handleImageSelect}
            />
          ) : null}
          {/* <ChatTools/> mark */}
          {/* <ChatTools
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          selectedImages={selectedImages}
          onImageDelete={handleImageDelete}
        /> */}
        </Box>
        <ComplianceTip type={'chat'} />
      </Box>
    );
  }
);
ChatInput.displayName = 'ChatInput';

export default React.memo(ChatInput);
