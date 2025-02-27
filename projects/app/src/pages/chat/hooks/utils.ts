import { share_h5_url } from '@/config';
export const redirectAuth = ({
  isEmptyPage,
  appId
}: { appId?: string; isEmptyPage?: boolean } = {}) => {
  const curUrl = `${window.location.origin}/chat?appId=${appId}`;
  if (isEmptyPage) {
    const emptyUrl = `${share_h5_url}/share/error?redirect=${curUrl}`;
    console.log('xxx emptyUrl', emptyUrl);
    window.location.href = emptyUrl;
  } else {
    const loginUrl = `${share_h5_url}/share/advLogin?redirect=${curUrl}`;
    console.log('xxx loginUrl', loginUrl);
    window.location.href = loginUrl;
  }
};
