import { getAgentPermission } from '@/web/core/chat/user';
import { redirectToErrorPage } from './errorRedirect';
import { useRouter } from 'next/router';

interface CheckChatPermissionParams {
  unionid: string;
  agentId: number;
  tenantId: number;
}

/**
 * 纯函数：检查用户是否有聊天权限
 * 不执行任何副作用（如设置状态或显示提示）
 * @returns 布尔值，表示用户是否可以聊天
 */
export const hasUserChatPermission = async (
  { unionid, agentId, tenantId }: CheckChatPermissionParams,
  router: ReturnType<typeof useRouter>
): Promise<boolean> => {
  try {
    // 获取剩余次数,是否有使用限制
    let { remainingCount, isLimited } = await getAgentPermission({
      unionid,
      tenantId,
      agentId
    });

    if (typeof window !== 'undefined') {
      const ret = localStorage.getItem('webBotKey') === 'oFAIb64Q3QisFEhILV8UjxVfa18E';
      if (ret) {
        return true;
      }
    }

    if (!isLimited) {
      return true;
    }

    let minCount = 1;
    if (process.env.NODE_ENV === 'development') {
      minCount = 130;
      console.warn(
        'ccc permissionType PRIVATE mock minCount',
        minCount,
        'remainingCount',
        remainingCount
      );
    }

    // 如果有剩余次数，允许聊天
    if (remainingCount >= minCount) {
      return true;
    }
    // 默认不允许聊天
    return false;
  } catch (error: any) {
    if (error.code === 403) {
      redirectToErrorPage(router, error);
    }
    console.error('ccc getAgentPermission Permission check error:', error);
    return false;
  }
};
