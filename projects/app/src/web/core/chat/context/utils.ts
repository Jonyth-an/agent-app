import { agentConfigInfo } from '@/global/core/user/api';
import Cookies from 'js-cookie';
import { getStaffInfo } from '../user';
import { redirectToErrorPage } from './errorRedirect';
import { useRouter } from 'next/router';
import { share_h5_url_front } from '@/web/common/utils/config';
export type RedirectAuthParams = {
  appId: string;
  tenantId: number;
  isEmptyPage?: boolean;
  value?: string;
};

export const getTenantTokenKey = (agentConfigInfo: agentConfigInfo) => {
  // 获取当前页面的host
  let host = window.location.host;
  // 将host按照'.'分割，取第一个元素
  host = host.split('.')[0];
  // 如果agentConfigInfo为空或者没有tenantId，则返回['token', `${host}token`]
  if (agentConfigInfo == null || !agentConfigInfo.tenantId) {
    return ['token', `${host}token`];
  }
  const tenantId = agentConfigInfo.tenantId;
  const tenantTokenKey = `${tenantId}token`;

  const domainTenantTokenKey = `${host}${tenantId}token`;
  return [tenantTokenKey, domainTenantTokenKey];
};

export const getShareToken = (agentConfigInfo: agentConfigInfo) => {
  const queryParams = new URLSearchParams(window.location.search);
  const [tenantTokenKey, domainTenantTokenKey] = getTenantTokenKey(agentConfigInfo);
  console.log('xxx [tenantTokenKey, domainTenantTokenKey]', [tenantTokenKey, domainTenantTokenKey]);
  let shareToken = Cookies.get(tenantTokenKey) || Cookies.get(domainTenantTokenKey);
  if (!shareToken) {
    shareToken =
      (queryParams.get(tenantTokenKey) as string) ||
      (queryParams.get(domainTenantTokenKey) as string) ||
      (queryParams.get('token') as string);
  }

  if (!shareToken) {
    console.error('No token provided for non-public agent');
  }
  return shareToken as string;
};
export interface TokenIsValidParams {
  agentConfigInfo: agentConfigInfo;
  appId: string;
  tenantId: number;
}
export const tokenIsValid = async (
  { agentConfigInfo, tenantId, appId }: TokenIsValidParams,
  router: ReturnType<typeof useRouter>
) => {
  const shareToken = getShareToken(agentConfigInfo);
  let shareTokenDes = {
    isValid: false,
    shareToken: '',
    staffInfo: {}
  };
  if (!shareToken) {
    redirectAuth({ appId, tenantId });
    return shareTokenDes;
  }
  try {
    const staffInfo = await getStaffInfo(shareToken, tenantId);
    shareTokenDes.isValid = true;
    shareTokenDes.shareToken = shareToken;
    shareTokenDes.staffInfo = staffInfo;
    return shareTokenDes;
  } catch (error: any) {
    console.error('xxx tokenIsValid error', error);
    const tenantId = agentConfigInfo.tenantId;
    const errorCode = (error as { code?: number }).code;

    if ([401].includes(errorCode as number)) {
      clearShareToken(agentConfigInfo);
      redirectAuth({ appId, tenantId });
    }
    redirectToErrorPage(router, error);

    return shareTokenDes;
  }
};

export const clearShareToken = (agentConfigInfo: agentConfigInfo) => {
  const [tenantTokenKey, domainTenantTokenKey] = getTenantTokenKey(agentConfigInfo);
  Cookies.remove(tenantTokenKey);
  Cookies.remove(domainTenantTokenKey);
  Cookies.remove('token');
};

export function redirectAuth({ isEmptyPage, appId, tenantId }: RedirectAuthParams) {
  if (typeof window !== 'undefined') {
    console.log('window 不存在');
  }
  const originUrl = share_h5_url_front();
  const curUrl = `${originUrl}/share-agent/chat?appId=${appId}`;
  const encodedCurUrl = encodeURIComponent(curUrl);
  const queryParams = new URLSearchParams(window.location.search);
  console.log("queryParams.get('debugger')", queryParams.get('debugger'));

  // if (isEmptyPage) {
  //   const emptyUrl = `${share_h5_url_front}/share/error?tenantId=${tenantId}&redirect=${encodedCurUrl}`;
  //   console.error('xxx emptyUrl', emptyUrl);
  //   if (process.env.NODE_ENV !== 'development') {
  //     window.location.href = emptyUrl;
  //   }
  // } else {

  const loginUrl = `${originUrl}/share/advLogin?tenantId=${tenantId}&redirect=${curUrl}`;
  const authorizeUrl = `${originUrl}/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=${encodeURIComponent(loginUrl)}`;
  console.error('xxx loginUrl', loginUrl);
  console.error('xxx loginUrl authorizeUrl', authorizeUrl);
  if (queryParams.get('debugger') === 'true') {
    return;
  }
  if (queryParams.get('dev') == '12345678') {
    debugger;
  }
  if (process.env.NODE_ENV !== 'development') {
    window.location.replace(authorizeUrl);
  }
  // }
}

export function toMemberLanding({ appId, tenantId, value }: RedirectAuthParams) {
  const originUrl = share_h5_url_front();
  const curUrl = `${originUrl}/share-agent/chat?appId=${appId}&tenantId=${tenantId}`;
  const encodedCurUrl = encodeURIComponent(curUrl);
  const memberLandingUrl = `${originUrl}/share/member?tenantId=${tenantId}&value=${value}&redirect=${encodedCurUrl}`;
  console.error('xxx memberLandingUrl', memberLandingUrl);
  if (process.env.NODE_ENV !== 'development') {
    window.location.href = memberLandingUrl;
  }
}

export const isMiniProgram = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 方法1: 检查 __wxjs_environment
    if (typeof window !== 'undefined' && window.__wxjs_environment === 'miniprogram') {
      resolve(true);
      return;
    }
    // 方法2: 使用 WeixinJSBridge 检测
    const checkWithJSBridge = () => {
      if (typeof window !== 'undefined' && window.__wxjs_environment === 'miniprogram') {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    if (typeof window !== 'undefined') {
      if (!window.WeixinJSBridge || !window.WeixinJSBridge.invoke) {
        document.addEventListener('WeixinJSBridgeReady', checkWithJSBridge, false);
        // 设置超时，避免无限等待
        setTimeout(() => resolve(false), 1000);
      } else {
        checkWithJSBridge();
      }
    } else {
      resolve(false);
    }
  });
};

// 如果需要同步版本，可以提供一个简化的检测方法
export const isMiniProgramSync = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // 优先使用官方推荐的 __wxjs_environment 检测
  if (window.__wxjs_environment === 'miniprogram') {
    return true;
  }

  // 备用方案：检查 userAgent（保持向后兼容）
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.indexOf('miniprogram') !== -1;
};

// 使用 wx.miniProgram.getEnv 的方法（需要引入微信 JS-SDK）
export const isMiniProgramWithWx = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // 检查是否存在 wx 对象和 miniProgram API
    if (typeof window.wx !== 'undefined' && window.wx.miniProgram && window.wx.miniProgram.getEnv) {
      window.wx.miniProgram.getEnv((res: { miniprogram: boolean }) => {
        resolve(!!res.miniprogram);
      });
    } else {
      // 如果 wx 对象不存在，回退到其他检测方法
      resolve(isMiniProgramSync());
    }
  });
};
