import { agentConfigInfo } from '@/global/core/user/api';
import Cookies from 'js-cookie';
import { share_h5_url } from '@/config';
export type RedirectAuthParams = {
  appId: string;
  tenantId: number;
  isEmptyPage?: boolean;
};
export function getShareUrl() {
  return window.location.origin;
}

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
    const error = new Error('No token provided for non-public agent');
    (error as any).code = 407;
    throw error;
  }
  return shareToken as string;
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
  const curUrl = `${share_h5_url}/share-agent/chat?appId=${appId}`;
  const encodedCurUrl = encodeURIComponent(curUrl);
  const queryParams = new URLSearchParams(window.location.search);
  console.log("queryParams.get('debugger')", queryParams.get('debugger'));
  if (queryParams.get('debugger') === 'true') {
    return;
  }
  if (queryParams.get('dev') == '12345678') {
    debugger;
  }
  if (isEmptyPage) {
    const emptyUrl = `${share_h5_url}/share/error?tenantId=${tenantId}&redirect=${encodedCurUrl}`;
    console.error('xxx emptyUrl', emptyUrl);
    if (process.env.NODE_ENV !== 'development') {
      window.location.href = emptyUrl;
    }
  } else {
    const loginUrl = `${share_h5_url}/share/advLogin?tenantId=${tenantId}&redirect=${curUrl}`;
    const authorizeUrl = `${share_h5_url}/marketing/marketing-api/api/v1/h5/redirect/wechat?serviceChannel=PRI&url=${encodeURIComponent(loginUrl)}`;
    console.error('xxx loginUrl', loginUrl);
    console.error('xxx loginUrl authorizeUrl', authorizeUrl);
    if (process.env.NODE_ENV !== 'development') {
      window.location.href = authorizeUrl;
    }
  }
}
