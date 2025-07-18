import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import RemarkMath from 'remark-math'; // Math syntax
import RemarkBreaks from 'remark-breaks'; // Line break
import RehypeKatex from 'rehype-katex'; // Math render
import RemarkGfm from 'remark-gfm'; // Special markdown syntax
import RehypeExternalLinks from 'rehype-external-links';

import dynamic from 'next/dynamic';
import { Box, Flex, Text, Link, Divider, Image } from '@chakra-ui/react';
import { CodeClassNameEnum, ContentItem, isContentCardJson, processContentCardData } from './utils';
import rehypeRaw from 'rehype-raw';
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

import ContentCardRenderer from './components/ContentCard/ContentCardRenderer';
import RealmArticle from './components/RealmArticle';
import { useStyleConfig } from './styles/styleUtils';
import MarketMaterials from './components/MarketMaterials';
import VideoCard from './components/VideoCard';

type Props = {
  source?: string;
  showAnimation?: boolean;
  isDisabled?: boolean;
  forbidZhFormat?: boolean;
  isHistory?: boolean;
  // customCardStyle?: any; // 添加自定义卡片样式属性 - 已移除
};

const Markdown = (props: Props) => {
  const source = props.source || '';

  const showAnimation = props.showAnimation || false;

  const isHistory = props.isHistory || false;
  // 检测是否是ContentCard JSON格式
  const isContentCard = useMemo(() => {
    return processContentCardData(source).length > 0;
  }, [source]);

  if (isContentCard) {
    return <ContentCardRenderer value={source} isHistory={isHistory} />;
  }

  return <MarkdownRender {...props} />;
};

const MarkdownRender = (props: Props) => {
  const { source = '', showAnimation, isDisabled, forbidZhFormat, isHistory } = props;
  console.log('mmm MarkdownRender props', props);
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

  // 自定义组件
  const components = useMemo<any>(
    () => ({
      img: MarkdownImage,
      pre: RewritePre,
      code: (props: any) => <CodeRenderer {...props} isHistory={isHistory} />,
      a: A,
      contentcard: (props: any) => <ContentCardRenderer {...props} isHistory={isHistory} />,
      RealmArticle: (props: any) => <RealmArticle {...props} isHistory={isHistory} />,
      marketMaterials: (props: any) => <MarketMaterials {...props} isHistory={isHistory} />
    }),
    [isHistory]
  );

  // 如果是ContentCard JSON格式，直接使用ContentCardRenderer渲染
  let styles = useStyleConfig();
  console.log('mmm MarkdownRender styles', styles);
  return (
    <Box position={'relative'}>
      <ReactMarkdown
        className={`markdown ${styles.markdown}
      ${showAnimation ? `${formatSource ? styles.waitingAnimation : styles.animation}` : ''}
    `}
        remarkPlugins={[RemarkMath, [RemarkGfm, { singleTilde: false }], RemarkBreaks]}
        rehypePlugins={[RehypeKatex, [RehypeExternalLinks, { target: '_blank' }], rehypeRaw]}
        components={components}
        urlTransform={urlTransform}
      >
        {formatSource}
      </ReactMarkdown>
      {isDisabled && <Box position={'absolute'} top={0} right={0} left={0} bottom={0} />}
    </Box>
  );
};

// 确保组件被正确地记忆化
export default React.memo(Markdown, (prevProps, nextProps) => {
  // 只在 source 或其他必要属性发生变化时重新渲染
  return (
    prevProps.source === nextProps.source &&
    prevProps.showAnimation === nextProps.showAnimation &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.forbidZhFormat === nextProps.forbidZhFormat &&
    prevProps.isHistory === nextProps.isHistory
  );
});

/* Custom dom */
function CodeRenderer(props: any) {
  console.log('mmm CodeRenderer props', props);
  const { className, codeBlock, children, isHistory } = props;
  const match = /language-(\w+)/.exec(className || '');
  const codeType = match?.[1];

  const strChildren = String(children);

  // 检测是否是ContentCard格式
  if (codeType === CodeClassNameEnum.linkCard) {
    return <RealmArticle value={strChildren} isHistory={true} />;
  }
  if (codeType === CodeClassNameEnum.fundManagerCard) {
    return <RealmArticle value={strChildren} isHistory={true} />;
  }
  if (codeType === CodeClassNameEnum.videoCard) {
    return <VideoCard value={strChildren} isHistory={true} />;
  }
  if (codeType === CodeClassNameEnum.realmArticle) {
    return <RealmArticle value={strChildren} isHistory={true} />;
  }
  if (codeType === CodeClassNameEnum.marketMaterials) {
    return <MarketMaterials value={strChildren} isHistory={true} />;
  }
  if (codeType === CodeClassNameEnum.contentCard) {
    return <ContentCardRenderer value={strChildren} isHistory={isHistory} />;
  }

  // 其他代码类型的处理逻辑
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
