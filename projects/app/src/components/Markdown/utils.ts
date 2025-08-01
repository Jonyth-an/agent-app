import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { RunPlatformEnum } from '@fastgpt/global/core/chat/constants';
import { useCallback, useMemo } from 'react';
export enum CodeClassNameEnum {
  guide = 'guide',
  questionGuide = 'questionGuide',
  mermaid = 'mermaid',
  echarts = 'echarts',
  quote = 'quote',
  files = 'files',
  latex = 'latex',
  iframe = 'iframe',
  html = 'html',
  video = 'video',
  audio = 'audio',
  fundManagerCard = 'fundManagerCard',
  linkCard = 'linkCard',
  videoCard = 'videoCard',
  contentCard = 'contentCard',
  marketMaterials = 'marketMaterials',
  realmArticle = 'realmArticle'
}

// ContentCard 相关工具函数
export interface ContentItem {
  id: string;
  title: string;
  avatar: string;
  url: string;
}

// 常量定义
export const CONTENT_CARD_MARK = 'codeClassNameEnum';
export const CONTENT_CARD_TYPE = 'CONTENT_CARD';

// 检查是否包含 ContentCard 标记
export const isContentCardFormat = (source: string): boolean => {
  if (!source || typeof source !== 'string') return false;

  // 使用正则表达式匹配，允许中间有空格、换行等
  const regex = new RegExp(`${CONTENT_CARD_MARK}\\s*:\\s*${CONTENT_CARD_TYPE}`);
  return (
    source.includes('RENDER_CONTENT_CARD') ||
    source.includes(CONTENT_CARD_MARK) ||
    regex.test(source)
  );
};

// 检查数据是否完整
export const isContentCardDataComplete = (source: string): boolean => {
  if (!isContentCardFormat(source)) return false;
  // 检查是否包含完整的 avatar 和 title
  return source.includes('avatar') && source.includes('title');
};

// 检查是否是ContentCard JSON格式
export const isContentCardJson = (source: string): boolean => {
  try {
    if (!source.trim().startsWith('{')) return false;
    const data = JSON.parse(source);
    return data.type === 'RENDER_CONTENT_CARD' && Array.isArray(data.data);
  } catch (e) {
    return false;
  }
};

// 解析旧版本格式的ContentCard数据
export const parseContentCardData = (source: string): ContentItem[] => {
  if (typeof source !== 'string') {
    return [];
  }

  const regex =
    /codeClassNameEnum:\s*(\w+)[\s\S]*?avatar:\s*(?:!\[.*?\]\((https?:\/\/[^\s]+)\)|https?:\/\/[^\s]+)[\s\S]*?title:\s*\[(.*?)\]\((.*?)\)/g;
  const entries: ContentItem[] = [];
  let index = 0;

  try {
    let match;
    while ((match = regex.exec(source)) !== null) {
      const codeClassNameEnumValue = match[1]?.trim();
      const avatar = match[2] ? match[2].trim() : match[3]?.trim();
      const title = match[3]?.trim();
      const url = match[4]?.trim();

      // 确保所有必需的字段都存在
      if (codeClassNameEnumValue && avatar && title && url) {
        entries.push({
          id: 'key_' + getNanoid() + '_' + index,
          avatar: avatar || '',
          title: title || '',
          url: url || ''
        });
        index += 1;
      }
    }
  } catch (error) {
    console.error('Error parsing content card data:', error);
  }

  return entries;
};

// 处理ContentCard数据，统一返回格式
export const processContentCardData = (source: string): ContentItem[] => {
  // 如果是JSON格式
  if (isContentCardJson(source)) {
    try {
      const parsedData = JSON.parse(source);
      return parsedData.data;
    } catch (e) {
      console.error('Failed to parse ContentCard JSON data:', e);
      return [];
    }
  }

  // 如果是旧版本格式
  if (isContentCardDataComplete(source)) {
    return parseContentCardData(source);
  }

  return [];
};

function htmlTableToLatex(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');

  if (!table) return '';

  let latex = '\\begin{tabular}{';

  // 获取列数
  const columns = table.querySelectorAll('tr:first-child th, tr:first-child td').length;
  latex += '|' + 'c|'.repeat(columns) + '}\n\\hline\n';

  // 创建一个二维数组来跟踪单元格合并情况
  const cellTracker = Array.from({ length: table.rows.length }, () => Array(columns).fill(false));

  // 遍历行
  table.querySelectorAll('tr').forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('th, td');
    let cellTexts: string[] = [];
    let colIndex = 0;

    cells.forEach((cell) => {
      // 跳过已经被合并的单元格
      while (cellTracker[rowIndex][colIndex]) {
        colIndex++;
      }

      // @ts-ignore
      const rowspan = parseInt(cell.getAttribute('rowspan') || 1, 10);
      // @ts-ignore
      const colspan = parseInt(cell.getAttribute('colspan') || 1, 10);

      // 添加单元格内容
      let cellText = cell.textContent?.trim() || '';
      if (colspan > 1) {
        cellText = `\\multicolumn{${colspan}}{|c|}{${cellText}}`;
      }
      if (rowspan > 1) {
        cellText = `\\multirow{${rowspan}}{*}{${cellText}}`;
      }
      cellTexts.push(cellText);

      // 标记合并的单元格
      for (let i = 0; i < rowspan; i++) {
        for (let j = 0; j < colspan; j++) {
          cellTracker[rowIndex + i][colIndex + j] = true;
        }
      }

      colIndex += colspan;
    });

    latex += cellTexts.join(' & ') + ' \\\\\n\\hline\n';
  });

  latex += '\\end{tabular}';

  return `\`\`\`${CodeClassNameEnum.latex}
    ${latex}
    \`\`\``;
}

export const formatMarkdownLink = (link: string) => {
  // 解析 URL
  const url = new URL(link);

  // 解析查询参数
  const queryParams = new URLSearchParams(url.search);

  // 检查 showPreview 参数及其值
  const showPreview = queryParams.get('showPreview') === '1';
  const linkType = queryParams.get('linkType') || undefined;
  const w = queryParams.get('w') || 200;
  const h = queryParams.get('h') || 300;
  if (showPreview) {
    // 删除 showPreview 参数
    queryParams.delete('showPreview');
    queryParams.delete('linkType');
    queryParams.delete('w');
    queryParams.delete('h');

    // 重新生成查询字符串
    const newSearch = queryParams.toString();

    // 构造新链接
    const accessLink = `${url.origin}${url.pathname}${newSearch ? '?' + newSearch : ''}`;

    // 返回结果
    return {
      showPreview: true,
      accessLink,
      originUrl: link,
      linkType,
      w,
      h
    };
  } else {
    return {
      showPreview: false,
      accessLink: link,
      originUrl: link,
      linkType,
      w,
      h
    };
  }
};

export function convertHtmlTablesToLatex(input: string) {
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  return input.replace(tableRegex, (match) => htmlTableToLatex(match));
}

export const getReturnColor = (returnValue: string) => {
  if (!returnValue) return '#222222';

  // 尝试提取数字部分
  const numValue = parseFloat(returnValue.replace('%', ''));

  if (isNaN(numValue)) return '#222222';

  if (numValue > 0) return '#ED4F4F';
  if (numValue < 0) return '#27a57c';
  return '#222222';
};
export const useLinkClick = () => {
  const { agentConfigInfo, runPlatform } = useChatStore();
  const card_config = useMemo(
    () => agentConfigInfo.agentConfig.miniprogram.card_config || {},
    [agentConfigInfo.agentConfig.miniprogram.card_config]
  );

  const handleLinkClick = useCallback(
    (href: string) => {
      if (runPlatform === RunPlatformEnum.MINI_PROGRAM) {
        const miniPath = card_config && card_config.miniPath;
        const url = `${miniPath}?url=${encodeURIComponent(href)}`;
        console.log('xxx clickCard url', url, 'runPlatform', runPlatform);
        wx.miniProgram.navigateTo({
          url
        });
      } else {
        window.location.href = href;
        console.log('xxx clickCard url', href, 'runPlatform', runPlatform);
      }
    },
    [runPlatform, card_config]
  );

  return {
    handleLinkClick
  };
};
