import React, { useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import RemarkMath from 'remark-math'; // Math syntax
import RemarkBreaks from 'remark-breaks'; // Line break
import RehypeKatex from 'rehype-katex'; // Math render
import RemarkGfm from 'remark-gfm'; // Special markdown syntax
import RehypeExternalLinks from 'rehype-external-links';

import styles from './index.module.scss';
import dynamic from 'next/dynamic';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import { CodeClassNameEnum } from './utils';
import { cloneDeep } from 'lodash';

const CodeLight = dynamic(() => import('./codeBlock/CodeLight'), { ssr: false });
const MermaidCodeBlock = dynamic(() => import('./img/MermaidCodeBlock'), { ssr: false });
const MdImage = dynamic(() => import('./img/Image'), { ssr: false });
const EChartsCodeBlock = dynamic(() => import('./img/EChartsCodeBlock'), { ssr: false });
const IframeCodeBlock = dynamic(() => import('./codeBlock/Iframe'), { ssr: false });
const IframeHtmlCodeBlock = dynamic(() => import('./codeBlock/iframe-html'), { ssr: false });
const VideoBlock = dynamic(() => import('./codeBlock/Video'), { ssr: false });
const AudioBlock = dynamic(() => import('./codeBlock/Audio'), { ssr: false });
// const ContentCard = dynamic(() => import('./contentCard'), { ssr: false });

const ChatGuide = dynamic(() => import('./chat/Guide'), { ssr: false });
const QuestionGuide = dynamic(() => import('./chat/QuestionGuide'), { ssr: false });
const A = dynamic(() => import('./A'), { ssr: false });

interface ContentItem {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
}

interface ContentCardProps {
  items: ContentItem[];
  maxItems?: number;
}

const ContentCard = ({ items, maxItems = 3 }: ContentCardProps) => {
  const displayItems = items;

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} bgColor="white">
      <Flex direction="column" gap={3}>
        {displayItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <Link href={item.link} isExternal _hover={{ textDecoration: 'none' }}>
              <Flex alignItems="start" gap={3} borderRadius="md" transition="background 0.2s">
                <Box flexShrink={0} width="65px" height="50px" overflow="hidden" borderRadius="md">
                  <Image
                    src={item.imageUrl || '/placeholder.svg'}
                    alt={item.title}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Text fontSize="14px" noOfLines={2} color="rgb(46, 48, 57)">
                    {item.title}
                  </Text>
                </Box>
              </Flex>
            </Link>
            {index < displayItems.length - 1 && <Divider borderColor="gray.200" />}
          </React.Fragment>
        ))}
      </Flex>
    </Box>
  );
};

type Props = {
  source?: string;
  showAnimation?: boolean;
  isDisabled?: boolean;
  forbidZhFormat?: boolean;
};

const isValidDataFormat = (input: string) => {
  const regex = /^avatar:\!\[.+?\]\(.+?\)\s+title:\[.+?\]\(.+?\)$/;
  return regex.test(input);
};

const parseData = (source: string) => {
  if (typeof source !== 'string') {
    return [];
  }

  const regex = /codeClassNameEnum:\s*(\w+)[\s\S]*?avatar:\s*(?:!\[.*?\]\((https?:\/\/[^\s]+)\)|https?:\/\/[^\s]+)[\s\S]*?title:\s*\[(.*?)\]\((.*?)\)/g;
  const entries = [];
  let index = 0;

  try {
    let match;
    while ((match = regex.exec(source)) !== null) {
      const codeClassNameEnumValue = match[1]?.trim();
      const avatarUrl = match[2] ? match[2].trim() : match[3]?.trim();
      const titleText = match[3]?.trim();
      const titleLink = match[4]?.trim();

      // 确保所有必需的字段都存在
      if (codeClassNameEnumValue && avatarUrl && titleText && titleLink) {
        entries.push({
          id: 'key' + index,
          codeClassNameEnum: codeClassNameEnumValue,
          imageUrl: avatarUrl,
          title: titleText,
          link: titleLink
        });
        index += 1;
      }
    }
  } catch (error) {
    console.error('Error parsing content card data:', error);
  }

  return entries;
};

const Markdown = (props: Props) => {
  const source = props.source || '';
  // 移除 cloneDeep，因为 source 是字符串类型，不需要深拷贝
  // const cardSource = cloneDeep(source);

  // 使用 useMemo 缓存解析结果
  const contentCardData = useMemo(() => {
    try {
      return parseData(source);
    } catch (error) {
      console.error('Parse content card data error:', error);
      return [];
    }
  }, [source]); // 只在 source 变化时重新计算

  // 使用 useMemo 缓存渲染判断
  const shouldRenderCard = useMemo(() => {
    return Array.isArray(contentCardData) && contentCardData.length > 0;
  }, [contentCardData]);

  if (shouldRenderCard) {
    return <ContentCard items={contentCardData} />;
  }

  if (source.length < 200000) {
    return <MarkdownRender {...props} />;
  }

  return <Box whiteSpace={'pre-wrap'}>{source}</Box>;
};

// 确保组件被正确地记忆化
export default React.memo(Markdown, (prevProps, nextProps) => {
  // 只在 source 或其他必要属性发生变化时重新渲染
  return (
    prevProps.source === nextProps.source &&
    prevProps.showAnimation === nextProps.showAnimation &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.forbidZhFormat === nextProps.forbidZhFormat
  );
});

function Paragraph(props: any) {
  const { node, children }: { node: any; children: React.ReactNode } = props;
  console.log('xxx aaa Paragraph props node, children', props, node, children);
  return <p className={styles.paragraph}>{children}</p>;
}
const MarkdownRender = ({ source = '', showAnimation, isDisabled, forbidZhFormat }: Props) => {
  const components = useMemo<any>(
    () => ({
      img: MarkdownImage,
      pre: RewritePre,
      code: Code,
      a: A
    }),
    []
  );

  const formatSource = useMemo(() => {
    if (showAnimation || forbidZhFormat) return source;

    // 保护 URL 格式：https://, http://, /api/xxx
    const urlPlaceholders: string[] = [];
    const textWithProtectedUrls = source.replace(
      /https?:\/\/(?:(?:[\w-]+\.)+[a-zA-Z]{2,6}|localhost)(?::\d{2,5})?(?:\/[\w\-./?%&=@]*)?/g,
      (match) => {
        urlPlaceholders.push(match);
        return `__URL_${urlPlaceholders.length - 1}__ `;
      }
    );

    // 处理中文与英文数字之间的分词
    const textWithSpaces = textWithProtectedUrls
      .replace(
        /([\u4e00-\u9fa5\u3000-\u303f])([a-zA-Z0-9])|([a-zA-Z0-9])([\u4e00-\u9fa5\u3000-\u303f])/g,
        '$1$3 $2$4'
      )
      // 处理引用标记
      .replace(/\n*(\[QUOTE SIGN\]\(.*\))/g, '$1')
      // 处理 [quote:id] 格式引用，将 [quote:675934a198f46329dfc6d05a] 转换为 [675934a198f46329dfc6d05a](QUOTE)
      .replace(/\[quote:?\s*([a-f0-9]{24})\](?!\()/gi, '[$1](QUOTE)')
      .replace(/\[([a-f0-9]{24})\](?!\()/g, '[$1](QUOTE)');

    // 还原 URL
    const finalText = textWithSpaces.replace(
      /__URL_(\d+)__/g,
      (_, index) => `${urlPlaceholders[parseInt(index)]}`
    );

    return finalText;
  }, [forbidZhFormat, showAnimation, source]);

  const urlTransform = useCallback((val: string) => {
    return val;
  }, []);

  return (
    <Box position={'relative'}>
      <ReactMarkdown
        className={`markdown ${styles.markdown}
      ${showAnimation ? `${formatSource ? styles.waitingAnimation : styles.animation}` : ''}
    `}
        remarkPlugins={[RemarkMath, [RemarkGfm, { singleTilde: false }], RemarkBreaks]}
        rehypePlugins={[RehypeKatex, [RehypeExternalLinks, { target: '_blank' }]]}
        components={components}
        urlTransform={urlTransform}
      >
        {formatSource}
      </ReactMarkdown>
      {isDisabled && <Box position={'absolute'} top={0} right={0} left={0} bottom={0} />}
    </Box>
  );
};

/* Custom dom */
function Code(e: any) {
  const { className, codeBlock, children } = e;
  const match = /language-(\w+)/.exec(className || '');
  const codeType = match?.[1];

  const strChildren = String(children);

  const Component = useMemo(() => {
    if (codeType === CodeClassNameEnum.mermaid) {
      return <MermaidCodeBlock code={strChildren} />;
    }
    if (codeType === CodeClassNameEnum.guide) {
      return <ChatGuide text={strChildren} />;
    }
    if (codeType === CodeClassNameEnum.questionGuide) {
      return <QuestionGuide text={strChildren} />;
    }
    if (codeType === CodeClassNameEnum.echarts) {
      return <EChartsCodeBlock code={strChildren} />;
    }
    if (codeType === CodeClassNameEnum.iframe) {
      return <IframeCodeBlock code={strChildren} />;
    }
    if (codeType === CodeClassNameEnum.contentCard) {
      return <ContentCard items={[]} />;
    }
    if (codeType && codeType.toLowerCase() === CodeClassNameEnum.html) {
      return (
        <IframeHtmlCodeBlock className={className} codeBlock={codeBlock} match={match}>
          {children}
        </IframeHtmlCodeBlock>
      );
    }
    if (codeType === CodeClassNameEnum.video) {
      return <VideoBlock code={strChildren} />;
    }
    if (codeType === CodeClassNameEnum.audio) {
      return <AudioBlock code={strChildren} />;
    }

    return (
      <CodeLight className={className} codeBlock={codeBlock} match={match}>
        {children}
      </CodeLight>
    );
  }, [codeType, className, codeBlock, match, children, strChildren]);

  return Component;
}

function MarkdownImage({ src }: { src?: string }) {
  return <MdImage src={src} />;
}

function RewritePre({ children }: any) {
  const modifiedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { codeBlock: true });
    }
    return child;
  });

  return <>{modifiedChildren}</>;
}
