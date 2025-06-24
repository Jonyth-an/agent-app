import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { ChatRoleEnum } from '@fastgpt/global/core/chat/constants';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { addLog } from '@fastgpt/service/common/system/log';

export type getLastThreeAIMessagesQuery = {};

export type getLastThreeAIMessagesBody = {
  keyWordReg?: string; // 改为字符串类型
  appId: string;
  chatId: string;
  obj?: ChatRoleEnum;
  limit?: number;
  sortDirection?: number;
};

// 将字符串转换为正则表达式的辅助函数
const stringToRegExp = (regString?: string): RegExp | undefined => {
  if (!regString) return undefined;

  // 检查是否是正则表达式格式 /pattern/flags
  const regexMatch = regString.match(/^\/(.*)\/(\w*)$/);
  if (regexMatch) {
    try {
      const [, pattern, flags] = regexMatch;
      return new RegExp(pattern, flags);
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return undefined;
    }
  }

  // 如果不是正则表达式格式，直接尝试创建
  try {
    return new RegExp(regString);
  } catch (error) {
    console.error('Invalid regex string:', error);
    return undefined;
  }
};

const checkAllMessagesContainNoInfo = (messages: any[], keyWordRegStr?: string) => {
  if (messages.length < 3) return false;

  // 只检查最近的3条消息
  const recentMessages = messages.slice(0, 3);

  // 将字符串转换为正则表达式
  let keyWordReg: RegExp | undefined = stringToRegExp(keyWordRegStr);

  // 默认正则表达式
  let keyWordRegDefault =
    /([没未]有?(找到|找不到|查到|查不到)|找不到|查不到).*?(您|你)?(想要|需要)的?(信息|内容|资料|答案)/;

  let keyWordRegLocal = keyWordReg || keyWordRegDefault;

  return recentMessages.every((message) => {
    // 确保message.value是数组且有元素
    if (!Array.isArray(message.value) || message.value.length === 0) {
      return false;
    }

    // 获取第一个text类型的内容
    const textItem = message.value.find((item: any) => item.type === 'text');
    if (!textItem || !textItem.text || !textItem.text.content) {
      return false;
    }

    const content = textItem.text.content;

    // 使用正则表达式进行宽松匹配
    // 匹配包含"没有找到"、"未找到"、"找不到"等与"您想要的信息"相关的内容

    let keyWordRegDefault =
      /([没未]有?(找到|找不到|查到|查不到)|找不到|查不到).*?(您|你)?(想要|需要)的?(信息|内容|资料|答案)/;

    let keyWordRegLocal = keyWordReg || keyWordRegDefault;

    return keyWordRegLocal.test(content);
  });
};

export type getLastThreeAIMessagesResponse = {
  messages: ChatItemType[];
  aiMsgs: ChatItemType[];
  hasKeyWords: boolean;
  appId?: string;
  chatId?: string;
};

// 查找最后几条指定类型的聊天记录
async function handler(
  req: ApiRequestProps<getLastThreeAIMessagesBody, getLastThreeAIMessagesQuery>,
  _res: ApiResponseType<any>
): Promise<getLastThreeAIMessagesResponse> {
  const {
    appId,
    chatId,
    keyWordReg, // 现在是字符串
    obj = ChatRoleEnum.AI,
    limit = 6,
    sortDirection = -1
  } = req.body;

  if (!chatId) {
    return { messages: [], aiMsgs: [], hasKeyWords: false };
  }

  // 查询指定类型的最后几条记录
  const messages = await MongoChatItem.find({
    appId,
    chatId
  })
    .sort({ _id: sortDirection as -1 | 1 }) // 按ID排序（默认降序，最新的在前）
    .limit(limit) // 限制返回记录数
    .lean(); // 返回普通JavaScript对象而不是Mongoose文档

  // 如果是降序查询，则反转结果以获得正确的时间顺序
  //   if (sortDirection === -1) {
  //     // messages.reverse();
  //   }

  // 处理旧格式的消息值（与getChatItems函数中的处理方式相同）
  messages.forEach((item) => {
    (item as any).responseData = [];
  });

  const aiMsgs = messages.filter((item) => item.obj === ChatRoleEnum.AI);

  // 检查最近三条AI消息是否都包含"没有找到您想要的信息"类似的字样
  const hasKeyWords = checkAllMessagesContainNoInfo(aiMsgs, keyWordReg);

  addLog.info('getLastThreeAIMessages', { appId, chatId, messages, aiMsgs, hasKeyWords });

  return { appId, chatId, messages, aiMsgs, hasKeyWords };
}

export default NextAPI(handler);
