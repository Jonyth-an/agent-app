import React, { useMemo } from 'react';
import { Box, Link } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import RemarkGfm from 'remark-gfm';
import RemarkMath from 'remark-math';
import RehypeKatex from 'rehype-katex';
import RemarkBreaks from 'remark-breaks';
import { EventNameEnum, eventBus } from '@/web/common/utils/eventbus';

import 'katex/dist/katex.min.css';
import Image from '../img/Image';
import { useStyleConfig } from '../styles/styleUtils';

function MyLink(e: any) {
  const href = e.href;
  const text = String(e.children);

  return !!href ? (
    <Link href={href} target={'_blank'}>
      {text}
    </Link>
  ) : (
    <Box as={'div'} mb={2} bg="#F5F7FA" px={'14px'} py={'9px'} rounded={'8px'}>
      <Box
        as={'span'}
        fontWeight={'medium'}
        fontSize={'14px'}
        lineHeight={'20px'}
        color={'#1A1A1A'}
        cursor={'pointer'}
        onClick={() => {
          eventBus.emit(EventNameEnum.sendQuestion, { text });
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

const Guide = ({ text }: { text: string }) => {
  const formatText = useMemo(
    () => text.replace(/\[(.*?)\]($|\n)/g, '[$1]()').replace(/\\n/g, '\n&nbsp;'),
    [text]
  );

  const styles = useStyleConfig();

  return (
    <ReactMarkdown
      className={`cus-markdown-wrapper markdown ${styles.markdown}`}
      remarkPlugins={[RemarkGfm, RemarkMath, RemarkBreaks]}
      rehypePlugins={[RehypeKatex]}
      components={{
        a: MyLink,
        p: 'div',
        img: Image
      }}
    >
      {formatText}
    </ReactMarkdown>
  );
};

export default React.memo(Guide);
